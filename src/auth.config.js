import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/round-table');
      const isApiProtectedRoute = nextUrl.pathname.startsWith('/api/') && 
                                  !nextUrl.pathname.startsWith('/api/auth') && 
                                  !nextUrl.pathname.startsWith('/api/cron') &&
                                  !nextUrl.pathname.startsWith('/api/orders/payment-verify');
      
      if (isProtectedRoute && !isLoggedIn) {
        return false; // Redirects to sign-in page
      }
      
      if (isApiProtectedRoute && !isLoggedIn) {
        return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      
      return true;
    }
  }
};
