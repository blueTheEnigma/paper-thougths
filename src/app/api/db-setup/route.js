import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    // Only allow in development or if a key is passed matching CLERK_SECRET_KEY
    if (!isDev && key !== process.env.CLERK_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        success: false, 
        error: 'DATABASE_URL is not set in environment variables. Please add it to your .env.local file' 
      }, { status: 500 });
    }

    const schemaPath = path.join(process.cwd(), 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({ success: false, error: `schema.sql not found at path: ${schemaPath}` }, { status: 404 });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run the schema DDL inside a transaction
    await Database.transaction(async (client) => {
      await client.query(schemaSql);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Database schemas initialized, table structures applied, and seed values populated successfully.' 
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Setup failed' }, { status: 500 });
  }
}
