"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (authError) {
      if (authError === "CredentialsSignin") {
        setError("Invalid email or password.");
      } else if (authError === "OAuthAccountNotLinked") {
        setError("This email is already associated with another login method.");
      } else if (authError === "CallbackRouteError") {
        setError("Authentication failed. Please verify your credentials.");
      } else {
        // Check for the specific migration error code
        setError("An error occurred during authentication.");
      }
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call NextAuth signIn with credentials
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password,
        redirect: false,
        callbackUrl
      });

      if (res?.error) {
        if (res.error.includes("MIGRATION_REQUIRED") || res.error.includes("password setup")) {
          // Redirect or show message for Clerk migration
          setError("SYSTEM UPGRADE: Since we've upgraded our system, please click the link below to set up a new credentials password for your account.");
        } else {
          setError(res.error || "Invalid email or password.");
        }
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white border border-ink/10 rounded-2xl p-8 shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-ink mb-2">Paper Thoughts</h1>
          <p className="font-sans text-sm text-ink/60">Log in to enter the Clubhouse</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg leading-relaxed">
            {error.startsWith("SYSTEM UPGRADE") ? (
              <div>
                <p className="font-semibold mb-2">System Upgrade Required</p>
                <p className="mb-3 text-red-700">We have migrated away from Clerk. Because of this, you need to set up a new credentials password.</p>
                <Link 
                  href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
                  className="inline-block bg-[#4A0E0E] hover:bg-[#3d0b0b] text-white px-4 py-2 rounded font-semibold text-xs transition"
                >
                  Set Up Password Now
                </Link>
              </div>
            ) : (
              error
            )}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/75 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-ink/15 rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] text-sm"
              disabled={loading || googleLoading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-ink/75 uppercase tracking-wider">
                Password
              </label>
              <Link 
                href="/auth/reset-password" 
                className="text-xs font-semibold text-[#4A0E0E] hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-ink/15 rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] text-sm"
              disabled={loading || googleLoading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 bg-[#4A0E0E] hover:bg-[#3d0b0b] text-white font-semibold text-sm rounded-lg shadow transition duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8 text-center">
          <hr className="border-ink/10" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Social Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-ink/15 hover:bg-cream/20 text-ink font-semibold text-sm rounded-lg shadow-sm transition duration-200 disabled:opacity-50"
        >
          <FcGoogle size={20} />
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Signup Prompt */}
        <p className="mt-8 text-center text-xs text-ink/60">
          Don't have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-[#4A0E0E] hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </main>
  );
}
