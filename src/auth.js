import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { Database } from "./lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const email = credentials.email.toLowerCase();
        
        // Find user by email in our database
        const dbUser = await Database.queryOne(`
          SELECT * FROM users WHERE email = $1
        `, [email]);

        if (!dbUser) {
          throw new Error("No user found with this email.");
        }

        // Check if user has a password hash (meaning they are migrated/credentials-enabled)
        if (!dbUser.password_hash) {
          // Trigger the password setup/reset error
          throw new Error("MIGRATION_REQUIRED");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, dbUser.password_hash);
        if (!isValid) {
          throw new Error("Invalid password.");
        }

        // Return user object for NextAuth session
        return {
          id: dbUser.id.toString(),
          email: dbUser.email,
          name: dbUser.full_name,
          lkid: dbUser.lk_id,
          onboarded: dbUser.onboarded
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        if (!user.email) return false;
        
        // Find user by email in database
        let dbUser = await Database.queryOne(`
          SELECT * FROM users WHERE email = $1
        `, [user.email.toLowerCase()]);

        if (!dbUser) {
          // Auto-create user if they don't exist
          dbUser = await Database.transaction(async (client) => {
            const userRes = await client.query(`
              INSERT INTO users (email, full_name, onboarded)
              VALUES ($1, $2, FALSE)
              RETURNING id
            `, [user.email.toLowerCase(), user.name || 'Anonymous']);
            
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
        }
        
        // Link user properties to the NextAuth user object
        user.id = dbUser.id.toString();
        user.name = dbUser.full_name;
        user.lkid = dbUser.lk_id;
        user.onboarded = dbUser.onboarded;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Pass user ID and custom attributes into JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.lkid = user.lkid;
        token.onboarded = user.onboarded;
      } else {
        // Query database to get latest user properties (like onboarded status)
        try {
          const dbUser = await Database.queryOne(`
            SELECT id, email, full_name, lk_id, onboarded FROM users WHERE id = $1
          `, [parseInt(token.id)]);
          if (dbUser) {
            token.name = dbUser.full_name;
            token.lkid = dbUser.lk_id;
            token.onboarded = dbUser.onboarded;
          }
        } catch (err) {
          console.error("Error fetching user data in JWT callback:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.lkid = token.lkid;
        session.user.onboarded = token.onboarded;
      }
      return session;
    }
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key-for-development-purposes-only-change-in-env",
});
