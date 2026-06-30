import { Database } from './db';

/**
 * Helper to determine if an identifier is a database user ID (integer) or clerk ID (string)
 */
function resolveUserIdFilter(identifier) {
  // If it's a number or a string containing only digits, it's a database user ID
  const parsed = parseInt(identifier, 10);
  if (!isNaN(parsed) && String(parsed) === String(identifier).trim()) {
    return { field: 'u.id', value: parsed };
  }
  return { field: 'u.clerk_id', value: identifier };
}

/**
 * Synchronize an authenticated user profile with the local database.
 * Auto-creates the user if they do not exist.
 */
export async function syncOrCreateUser(sessionUser) {
  if (!sessionUser) return null;
  
  // Accept either NextAuth session user or Clerk user structure
  const email = sessionUser.email || sessionUser.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    console.error("User has no email address", sessionUser.id);
    return null;
  }
  
  const fullName = sessionUser.name || `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim() || sessionUser.username || 'Anonymous';
  
  try {
    // 1. Try to find the user by email
    let dbUser = await Database.queryOne(`
      SELECT * FROM users WHERE email = $1
    `, [email.toLowerCase()]);
    
    if (!dbUser) {
      // 2. If user doesn't exist, create a new record and assign an LK-ID
      dbUser = await Database.transaction(async (client) => {
        const userRes = await client.query(`
          INSERT INTO users (email, full_name)
          VALUES ($1, $2)
          RETURNING id
        `, [email.toLowerCase(), fullName]);
        
        const newUserId = userRes.rows[0].id;
        const year = new Date().getFullYear();
        const lkId = `LK-${year}-${1000 + newUserId}`;
        
        const updatedRes = await client.query(`
          UPDATE users 
          SET lk_id = $1 
          WHERE id = $2 
          RETURNING *
        `, [lkId, newUserId]);
        
        return updatedRes.rows[0];
      });
      console.log('Synchronized new user with LK-ID:', dbUser.email, dbUser.lk_id);
    } else {
      // 3. Automatically generate LK-ID if user exists but lacks one
      if (!dbUser.lk_id) {
        const year = new Date().getFullYear();
        const lkId = `LK-${year}-${1000 + dbUser.id}`;
        dbUser = await Database.queryOne(`
          UPDATE users 
          SET lk_id = $1 
          WHERE id = $2 
          RETURNING *
        `, [lkId, dbUser.id]);
        console.log('Generated missing LK-ID for user ID:', dbUser.id);
      }
    }
    
    return dbUser;
  } catch (error) {
    console.error('Error in syncOrCreateUser:', error);
    return null;
  }
}

/**
 * Check if a user has a specific administrative permission key.
 */
export async function hasPermission(userIdentifier, permissionKey) {
  if (!userIdentifier) return false;
  
  const { field, value } = resolveUserIdFilter(userIdentifier);
  
  try {
    const result = await Database.query(`
      SELECT 1 FROM user_permissions up
      JOIN users u ON u.id = up.user_id
      JOIN permissions p ON p.id = up.permission_id
      WHERE ${field} = $1 AND p.permission_key = $2
    `, [value, permissionKey]);
    
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking permission ${permissionKey} for ${userIdentifier}:`, error);
    return false;
  }
}

/**
 * Retrieve all administrative permission keys assigned to a user.
 */
export async function getUserPermissions(userIdentifier) {
  if (!userIdentifier) return [];
  
  const { field, value } = resolveUserIdFilter(userIdentifier);
  
  try {
    const rows = await Database.query(`
      SELECT p.permission_key FROM user_permissions up
      JOIN users u ON u.id = up.user_id
      JOIN permissions p ON p.id = up.permission_id
      WHERE ${field} = $1
    `, [value]);
    
    return rows.map(r => r.permission_key);
  } catch (error) {
    console.error(`Error fetching permissions list for ${userIdentifier}:`, error);
    return [];
  }
}

/**
 * Assign a permission key to a user in the database.
 */
export async function grantPermission(userId, permissionKey) {
  try {
    const permission = await Database.queryOne(`
      SELECT id FROM permissions WHERE permission_key = $1
    `, [permissionKey]);
    
    if (!permission) {
      throw new Error(`Permission key '${permissionKey}' does not exist.`);
    }
    
    await Database.query(`
      INSERT INTO user_permissions (user_id, permission_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userId, permission.id]);
    
    return true;
  } catch (error) {
    console.error(`Error granting permission ${permissionKey} to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Remove a permission key from a user.
 */
export async function revokePermission(userId, permissionKey) {
  try {
    const permission = await Database.queryOne(`
      SELECT id FROM permissions WHERE permission_key = $1
    `, [permissionKey]);
    
    if (!permission) return false;
    
    await Database.query(`
      DELETE FROM user_permissions 
      WHERE user_id = $1 AND permission_id = $2
    `, [userId, permission.id]);
    
    return true;
  } catch (error) {
    console.error(`Error revoking permission ${permissionKey} from user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if a user has crew access.
 * Returns true if the user is the superadmin, has the 'crew_access' permission,
 * or has an active entry in the crew_members table.
 */
export async function isCrewMember(userIdentifier) {
  if (!userIdentifier) return false;

  const { field, value } = resolveUserIdFilter(userIdentifier);

  try {
    // 1. Get user details from database
    const dbUser = await Database.queryOne(`
      SELECT id, email FROM users WHERE ${field} = $1
    `, [value]);

    if (!dbUser) return false;

    // 2. Check superadmin (from env, fallback to umorgan2001@gmail.com)
    const superadminEmail = (process.env.SUPERADMIN_EMAIL || "umorgan2001@gmail.com").toLowerCase();
    if (dbUser.email && dbUser.email.toLowerCase() === superadminEmail) {
      return true;
    }

    // 3. Check for 'crew_access' permission
    const hasPerm = await hasPermission(dbUser.id, 'crew_access');
    if (hasPerm) return true;

    // 4. Check crew_members active membership
    const crewMember = await Database.queryOne(`
      SELECT 1 FROM crew_members 
      WHERE user_id = $1 AND is_active = TRUE
    `, [dbUser.id]);

    return !!crewMember;
  } catch (error) {
    console.error(`Error checking crew membership for identifier ${userIdentifier}:`, error);
    return false;
  }
}

