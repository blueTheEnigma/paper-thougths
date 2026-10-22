import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const gatheringId = parseInt(id, 10);
    if (isNaN(gatheringId)) {
      return NextResponse.json({ success: false, error: 'Invalid gathering ID' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { targetAttendanceId, disputeReason, counterPhotoProof } = body;

    if (!disputeReason || !counterPhotoProof) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a clear reason and upload your venue counter-photo proof.'
      }, { status: 400 });
    }

    const dispute = await Database.queryOne(`
      INSERT INTO gathering_disputes (
        gathering_id, disputant_user_id, target_attendance_id, dispute_reason, counter_photo_proof, status
      )
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [
      gatheringId,
      dbUser.id,
      targetAttendanceId ? parseInt(targetAttendanceId, 10) : null,
      disputeReason,
      counterPhotoProof
    ]);

    return NextResponse.json({
      success: true,
      message: 'Gate integrity dispute filed privately with the Chapter Lead and Superadmins. The claim will be adjudicated.',
      disputeId: dispute.id
    });

  } catch (error) {
    console.error('Error filing dispute:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to file dispute' }, { status: 500 });
  }
}
