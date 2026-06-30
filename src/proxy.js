import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/round-table');
  const isApiProtectedRoute = nextUrl.pathname.startsWith('/api/') && 
                              !nextUrl.pathname.startsWith('/api/auth') && 
                              !nextUrl.pathname.startsWith('/api/cron') &&
                              !nextUrl.pathname.startsWith('/api/orders/payment-verify'); // Paystack callback needs to be public

  if (isProtectedRoute && !isLoggedIn) {
    // Redirect unauthenticated requests to sign-in page
    const loginUrl = new URL("/sign-in", nextUrl.origin);
    // Keep track of the original page to redirect back after sign-in
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return Response.redirect(loginUrl);
  }

  if (isApiProtectedRoute && !isLoggedIn) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
});

// Configure matching paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/round-table/:path*",
    "/api/:path*",
  ],
};
