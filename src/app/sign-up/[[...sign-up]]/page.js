"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const refCode = searchParams.get("ref") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, referral: refCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register.");
      }

      setSuccess(data.message || "Account created successfully! Logging you in...");
      
      // Auto sign in the user after successful registration
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password,
        redirect: false,
        callbackUrl
      });

      if (loginRes?.error) {
        // If auto login fails, redirect them to sign-in page to log in manually
        setTimeout(() => {
          window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 1500);
      }

    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
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
          <h1 className="font-playfair text-3xl font-bold text-ink mb-2">Join the Club</h1>
          <p className="font-sans text-sm text-ink/60">Create your Paper Thoughts archive account</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
            {success}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/75 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Foluso Agbaje"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-ink/15 rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] text-sm"
              disabled={loading || googleLoading}
            />
          </div>

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
            <label className="block text-xs font-semibold text-ink/75 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Min. 6 characters"
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
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8 text-center">
          <hr className="border-ink/10" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Social Sign Up */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-ink/15 hover:bg-cream/20 text-ink font-semibold text-sm rounded-lg shadow-sm transition duration-200 disabled:opacity-50"
        >
          <FcGoogle size={20} />
          {googleLoading ? "Connecting..." : "Register with Google"}
        </button>

        {/* Login Prompt */}
        <p className="mt-8 text-center text-xs text-ink/60">
          Already have an account?{" "}
          <Link href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-[#4A0E0E] hover:underline">
            Log in here
          </Link>
        </p>

      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
        <div className="text-center p-8 text-ink/60 font-sans">
          Loading sign-up form...
        </div>
      </main>
    }>
      <SignUpForm />
    </Suspense>
  );
}
