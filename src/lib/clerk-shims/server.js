import { auth } from "../../auth";

export async function currentUser() {
  try {
    const session = await auth();
    if (!session || !session.user) return null;
    
    // Split name into first and last
    const nameParts = (session.user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      id: session.user.id, // Database user ID
      firstName,
      lastName,
      username: session.user.email ? session.user.email.split('@')[0] : 'user',
      emailAddresses: [
        { emailAddress: session.user.email }
      ],
      primaryEmailAddress: {
        emailAddress: session.user.email
      }
    };
  } catch (error) {
    console.error("Clerk shim currentUser error:", error);
    return null;
  }
}

export const clerkMiddleware = () => {
  return () => {};
};

export const createRouteMatcher = () => {
  return () => false;
};
