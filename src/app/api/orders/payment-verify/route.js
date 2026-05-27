import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { reference, lkid, name, email, items, subtotal, discount, total, leavesUsed } = await requestData(req);

    const finalTotal = Math.max(0, parseFloat(total || 0));
    const leaves = parseInt(leavesUsed || 0, 10);
    const isLeafOnly = finalTotal === 0;

    // 1. Resolve User ID and validate leaves
    let dbUser = null;
    let dbUserId = null;
    let guestName = name || 'Guest Reader';
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        dbUser = await syncOrCreateUser(clerkUser);
        if (dbUser) {
          dbUserId = dbUser.id;
          guestName = null;
        }
      }
    } catch (e) {
      console.warn('Authentication check failed or user is not logged in:', e.message);
    }

    if (leaves > 0) {
      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'You must be signed in to purchase with Paper Leaves.' }, { status: 401 });
      }
      if ((dbUser.spendable_leaves || 0) < leaves) {
        return NextResponse.json({ success: false, error: `Insufficient leaves balance: You only have ${dbUser.spendable_leaves || 0} Paper Leaves.` }, { status: 400 });
      }
    }

    // 2. Verify payment with Paystack if not a leaf-only order
    if (!isLeafOnly) {
      if (!reference) {
        return NextResponse.json({ success: false, error: 'Missing transaction reference.' }, { status: 400 });
      }

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        return NextResponse.json({ success: false, error: 'Paystack is not configured on the server.' }, { status: 500 });
      }

      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (!paystackRes.ok) {
        const errText = await paystackRes.text();
        console.error('Paystack verification request failed:', errText);
        return NextResponse.json({ success: false, error: 'Failed to contact Paystack.' }, { status: 400 });
      }

      const paystackData = await paystackRes.json();
      
      if (!paystackData.status || paystackData.data.status !== 'success') {
        return NextResponse.json({ success: false, error: 'Payment was not successful.' }, { status: 400 });
      }

      // Verify amount matches (Paystack amount is in kobo)
      const expectedKobo = finalTotal * 100;
      const actualKobo = paystackData.data.amount;
      
      if (Math.abs(actualKobo - expectedKobo) > 100) { // Allow up to 1 NGN difference for safety
        return NextResponse.json({ success: false, error: 'Payment amount mismatch.' }, { status: 400 });
      }
    }

    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Google Sheets configuration missing.' }, { status: 500 });
    }

    const salesRep = isLeafOnly ? 'Leaves' : (leaves > 0 ? 'Paystack + Leaves' : 'Paystack');

    // 3. Log the order to Google Sheets (createOrder)
    let orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
    try {
      const createRes = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createOrder',
          lkid: lkid || 'Guest',
          name: name || 'Guest Reader',
          items: items.map(i => ({ title: i.title, price: i.price })),
          subtotal,
          discount: parseFloat(discount || 0) + (leaves * 10), // Total discount includes applied leaves value
          total: finalTotal,
          salesRep
        })
      });
      const createData = await createRes.json();
      if (createData.success && createData.orderId) {
        orderId = createData.orderId;
      }
    } catch (e) {
      console.error('Failed to log order to Google Sheets:', e);
    }
 
    // 4. Finalize the order to 'Paid' in Google Sheets (marks books Sold Out in sheet)
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalizeOrder',
          orderId
        })
      });
    } catch (e) {
      console.error('Failed to finalize order in Google Sheets:', e);
    }
 
    // 5. Write the order and update leaves in local PostgreSQL database (transaction)
    const itemsText = items.map(i => i.title).join(', ');
    try {
      await Database.transaction(async (client) => {
        // Insert order record
        await client.query(`
          INSERT INTO orders (order_id, user_id, guest_name, items, subtotal, discount, total, status, sales_rep, leaves_spent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          orderId,
          dbUserId,
          guestName,
          itemsText,
          subtotal,
          discount,
          finalTotal,
          'Paid',
          salesRep,
          leaves
        ]);

        // Deduct spendable leaves from user and log transaction
        if (leaves > 0) {
          await client.query(`
            UPDATE users 
            SET spendable_leaves = spendable_leaves - $1 
            WHERE id = $2
          `, [leaves, dbUserId]);

          await client.query(`
            INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
            VALUES ($1, $2, 'checkout_spend', $3)
          `, [dbUserId, -leaves, `Spent ${leaves} leaves on order ${orderId}`]);
        }
      });
    } catch (e) {
      console.error('Failed to save order/deduct leaves in local PostgreSQL:', e);
    }

    // 6. Send email notification to all admins with sales auth AND the buyer
    try {
      // Find all admins with 'view_sales_logs' permission
      const admins = await Database.query(`
        SELECT u.email FROM users u
        JOIN user_permissions up ON u.id = up.user_id
        JOIN permissions p ON p.id = up.permission_id
        WHERE p.permission_key = 'view_sales_logs'
      `);
      const adminEmails = admins.map(a => a.email).filter(Boolean);

      // Email to Admins
      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails,
          subject: `🚨 [New Sale Logged] Order ID: ${orderId}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e1e1e; line-height: 1.6;">
              <h2 style="color: #800020;">New Sale Confirmed via Paystack</h2>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Customer Name:</strong> ${name || 'Guest Reader'}</p>
              <p><strong>Customer Email:</strong> ${email || 'No email provided'}</p>
              <p><strong>Items:</strong> ${itemsText}</p>
              <p><strong>Total Paid:</strong> ₦${total}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
              <p style="font-size: 12px; color: #777;">This is an automated notification from the Paper Thoughts Archive.</p>
            </div>
          `
        });
      }

      // Email to Buyer
      if (email) {
        await sendEmail({
          to: email,
          subject: `📚 Order Confirmed! ID: ${orderId} - Paper Thoughts Archive`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e1e1e; line-height: 1.6;">
              <h2 style="color: #800020;">Thank you for your purchase!</h2>
              <p>Hi ${name || 'Reader'}, your payment has been successfully processed and verified.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Items:</strong> ${itemsText}</p>
              <p><strong>Total Paid:</strong> ₦${total}</p>
              <p>Your books have been set aside. You can pick them up at our next <strong>Saturday meeting in Zaria</strong>.</p>
              <br/>
              <p>Warm regards,<br/>The Paper Thoughts Team</p>
            </div>
          `
        });
      }
    } catch (e) {
      console.error('Failed to send sales/buyer email notifications:', e);
    }

    return NextResponse.json({ success: true, orderId });

  } catch (error) {
    console.error('Paystack verification route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error verification failed.' }, { status: 500 });
  }
}

// Utility to parse request body securely
async function requestData(req) {
  try {
    return await req.json();
  } catch (e) {
    return {};
  }
}
