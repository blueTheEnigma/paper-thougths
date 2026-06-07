import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember, logActivity } from '@/lib/round-table';
import fs from 'fs';
import path from 'path';

// POST - Upload file attachment
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Size limit check (10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save locally
    const uploadDir = path.join(process.cwd(), 'public/uploads/crew');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Append timestamp to prevent name collision
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/crew/${filename}`;

    // Save metadata in database
    const attachmentRes = await Database.queryOne(`
      INSERT INTO crew_attachments (task_id, uploaded_by, file_name, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [id, caller.id, file.name, relativePath, file.size, file.type]);

    const task = await Database.queryOne('SELECT title FROM crew_tasks WHERE id = $1', [id]);
    await logActivity(caller.id, 'attachment_uploaded', 'task', id, { taskTitle: task?.title });

    return NextResponse.json({ 
      success: true, 
      attachment: {
        id: attachmentRes.id,
        file_name: file.name,
        file_path: relativePath,
        file_size: file.size,
        mime_type: file.type,
        created_at: attachmentRes.created_at,
        uploader_name: caller.fullName
      }
    });
  } catch (error) {
    console.error("POST /api/round-table/tasks/[id]/attachments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Remove file attachment
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');
    if (!attachmentId) {
      return NextResponse.json({ success: false, error: 'Attachment ID is required' }, { status: 400 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const attachment = await Database.queryOne('SELECT * FROM crew_attachments WHERE id = $1', [attachmentId]);
    if (!attachment) {
      return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 });
    }

    // Only task creator, uploader or admin/lead can delete attachments
    if (attachment.uploaded_by !== caller.id && caller.role !== 'admin' && caller.role !== 'lead' && !caller.isSuperadmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Delete locally
    const filePath = path.join(process.cwd(), 'public', attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await Database.query('DELETE FROM crew_attachments WHERE id = $1', [attachmentId]);

    const task = await Database.queryOne('SELECT title FROM crew_tasks WHERE id = $1', [id]);
    await logActivity(caller.id, 'attachment_deleted', 'task', id, { taskTitle: task?.title });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/round-table/tasks/[id]/attachments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
