import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';

const RESERVED_ALIASES = new Set([
  'admin', 'administrator', 'paperthoughts', 'pt', 'moderator', 'system',
  'sanctuary', 'crucible', 'herald', 'bookie', 'official', 'support',
  'bot', 'root', 'help', 'api', 'dashboard', 'archive', 'roundtable'
]);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawAlias = searchParams.get('alias') || '';
    
    // Normalize: strip leading @, trim whitespace, lowercase
    const cleanAlias = rawAlias.replace(/^@+/, '').trim().toLowerCase();

    if (!cleanAlias) {
      return NextResponse.json({ 
        available: false, 
        reason: 'Please enter an alias.' 
      }, { status: 400 });
    }

    // Format validation: 3 to 25 chars, alphanumeric and underscore only
    if (cleanAlias.length < 3) {
      return NextResponse.json({ 
        available: false, 
        reason: 'Alias must be at least 3 characters long.' 
      });
    }

    if (cleanAlias.length > 25) {
      return NextResponse.json({ 
        available: false, 
        reason: 'Alias must be at most 25 characters long.' 
      });
    }

    if (!/^[a-z0-9_]+$/.test(cleanAlias)) {
      return NextResponse.json({ 
        available: false, 
        reason: 'Only letters, numbers, and underscores are allowed.' 
      });
    }

    // Reserved keyword check
    if (RESERVED_ALIASES.has(cleanAlias)) {
      return NextResponse.json({ 
        available: false, 
        reason: 'This alias is reserved by the Sanctuary.' 
      });
    }

    // Check if the current user already owns this alias
    const user = await currentUser();
    const currentUserId = user?.id ? parseInt(user.id) : null;

    let queryText = 'SELECT id FROM users WHERE LOWER(alias) = $1';
    const queryParams = [cleanAlias];

    if (currentUserId && !isNaN(currentUserId)) {
      queryText += ' AND id != $2';
      queryParams.push(currentUserId);
    }

    const existing = await Database.queryOne(queryText, queryParams);

    if (existing) {
      return NextResponse.json({ 
        available: false, 
        reason: 'This alias is already taken by another Reader.' 
      });
    }

    return NextResponse.json({ 
      available: true, 
      alias: cleanAlias,
      message: `@${cleanAlias} is available!` 
    });
  } catch (error) {
    console.error('Error in /api/me/check-alias:', error);
    return NextResponse.json({ 
      available: false, 
      error: 'Failed to verify alias.' 
    }, { status: 500 });
  }
}

