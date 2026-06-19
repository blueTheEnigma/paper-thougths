import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import fs from 'fs';
import path from 'path';

// POST - Update avatar (custom file upload OR preset selection)
export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(user);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Preset Selection
      const body = await req.json();
      const { presetUrl } = body;
      
      if (!presetUrl) {
        return NextResponse.json({ success: false, error: 'Missing presetUrl' }, { status: 400 });
      }

      await Database.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [presetUrl, dbUser.id]);
      return NextResponse.json({ success: true, avatarUrl: presetUrl });
    } else {
      // Multipart File Upload
      const formData = await req.formData();
      const file = formData.get('file');
      
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      // Check mime type is image
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, error: 'Only image files are allowed.' }, { status: 400 });
      }

      // Max size limit (5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save locally
      const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate a collision-safe filename using user ID and timestamp
      const ext = path.extname(file.name) || '.png';
      const filename = `avatar_${dbUser.id}_${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      const relativePath = `/uploads/avatars/${filename}`;

      // Update database
      await Database.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [relativePath, dbUser.id]);

      return NextResponse.json({ 
        success: true, 
        avatarUrl: relativePath 
      });
    }
  } catch (error) {
    console.error("POST /api/me/avatar error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Revert avatar to default (NULL)
export async function DELETE() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(user);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    // Get current avatar to delete local file if it is an uploaded one
    const currentAvatar = dbUser.avatar_url;
    if (currentAvatar && currentAvatar.startsWith('/uploads/avatars/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', currentAvatar);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error("Failed to delete local avatar file:", fileErr);
      }
    }

    await Database.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [dbUser.id]);

    return NextResponse.json({ success: true, avatarUrl: null });
  } catch (error) {
    console.error("DELETE /api/me/avatar error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
