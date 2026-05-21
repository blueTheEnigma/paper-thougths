import { Database } from './db';

/**
 * Synchronize a Clerk user profile with the local database.
 * Auto-creates the user if they do not exist, or updates their profile if they do.
 */
export async function syncOrCreateUser(clerkUser) {
  if (!clerkUser) return null;
  
  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    console.error("Clerk user has no email address", clerkUser.id);
    return null;
  }
  
  const clerkId = clerkUser.id;
  const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Anonymous';
  
  try {
    // 1. Try to find the user by clerk_id or email
    let dbUser = await Database.queryOne(`
      SELECT * FROM users WHERE clerk_id = $1 OR email = $2
    `, [clerkId, email.toLowerCase()]);
    
    if (!dbUser) {
      // 2. If user doesn't exist, create a new record and assign an LK-ID
      dbUser = await Database.transaction(async (client) => {
        const userRes = await client.query(`
          INSERT INTO users (clerk_id, email, full_name)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [clerkId, email.toLowerCase(), fullName]);
        
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
      console.log('Synchronized new Clerk user with LK-ID:', dbUser.email, dbUser.lk_id);
    } else {
      // 3. If user exists but clerk_id is mismatching or empty, update it
      let needsUpdate = false;
      const updates = [];
      const params = [];
      let paramCount = 1;
      
      if (dbUser.clerk_id !== clerkId) {
        updates.push(`clerk_id = $${paramCount++}`);
        params.push(clerkId);
        needsUpdate = true;
      }
      
      // Update name if empty in DB but available in Clerk
      if (!dbUser.full_name && fullName) {
        updates.push(`full_name = $${paramCount++}`);
        params.push(fullName);
        needsUpdate = true;
      }

      // Automatically generate LK-ID if user exists but lacks one
      if (!dbUser.lk_id) {
        const year = new Date().getFullYear();
        const lkId = `LK-${year}-${1000 + dbUser.id}`;
        updates.push(`lk_id = $${paramCount++}`);
        params.push(lkId);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        params.push(dbUser.id);
        dbUser = await Database.queryOne(`
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `, params);
        console.log('Updated user sync details for ID:', dbUser.id);
      }
    }
    
    return dbUser;
  } catch (error) {
    console.error('Error in syncOrCreateUser:', error);
    return null;
  }
}

/**
 * Check if a Clerk user has a specific administrative permission key.
 */
export async function hasPermission(clerkId, permissionKey) {
  if (!clerkId) return false;
  
  try {
    const result = await Database.query(`
      SELECT 1 FROM user_permissions up
      JOIN users u ON u.id = up.user_id
      JOIN permissions p ON p.id = up.permission_id
      WHERE u.clerk_id = $1 AND p.permission_key = $2
    `, [clerkId, permissionKey]);
    
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking permission ${permissionKey} for ${clerkId}:`, error);
    return false;
  }
}

/**
 * Retrieve all administrative permission keys assigned to a Clerk user.
 */
export async function getUserPermissions(clerkId) {
  if (!clerkId) return [];
  
  try {
    const rows = await Database.query(`
      SELECT p.permission_key FROM user_permissions up
      JOIN users u ON u.id = up.user_id
      JOIN permissions p ON p.id = up.permission_id
      WHERE u.clerk_id = $1
    `, [clerkId]);
    
    return rows.map(r => r.permission_key);
  } catch (error) {
    console.error(`Error fetching permissions list for ${clerkId}:`, error);
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
