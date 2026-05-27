import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { reference, lkid, name, email, items, subtotal, discount, total } = await requestData(req);

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Missing transaction reference.' }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ success: false, error: 'Paystack is not configured on the server.' }, { status: 500 });
    }

    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Google Sheets configuration missing.' }, { status: 500 });
    }

    // 1. Verify payment with Paystack API
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
    const expectedKobo = total * 100;
    const actualKobo = paystackData.data.amount;
    
    if (Math.abs(actualKobo - expectedKobo) > 100) { // Allow up to 1 NGN difference for safety
      return NextResponse.json({ success: false, error: 'Payment amount mismatch.' }, { status: 400 });
    }

    // 2. Resolve User ID in PostgreSQL
    let dbUserId = null;
    let guestName = name || 'Guest Reader';
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const dbUser = await syncOrCreateUser(clerkUser);
        if (dbUser) {
          dbUserId = dbUser.id;
          guestName = null;
        }
      }
    } catch (e) {
      console.warn('Authentication check failed or user is not logged in:', e.message);
    }

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
          discount,
          total,
          salesRep: 'Paystack'
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

    // 5. Write the order to the local PostgreSQL database
    const itemsText = items.map(i => i.title).join(', ');
    try {
      await Database.query(`
        INSERT INTO orders (order_id, user_id, guest_name, items, subtotal, discount, total, status, sales_rep)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        orderId,
        dbUserId,
        guestName,
        itemsText,
        subtotal,
        discount,
        total,
        'Paid',
        'Paystack'
      ]);
    } catch (e) {
      console.error('Failed to save order to local PostgreSQL database:', e);
      // We do not fail the request if local DB write fails, as the money was paid and sheets updated.
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
