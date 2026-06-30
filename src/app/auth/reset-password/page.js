"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token");
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to request password setup.");
      }

      setSuccess("A password setup link has been sent to your email. Please check your inbox (and spam folder).");
      setEmail("");
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setSuccess("Your password has been updated successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-ink/10 rounded-2xl p-8 shadow-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-playfair text-3xl font-bold text-ink mb-2">
          {token ? "Set Up Password" : "Password Setup"}
        </h1>
        <p className="font-sans text-sm text-ink/60">
          {token 
            ? "Enter your new credentials password below" 
            : "Request a secure link to set up your password"}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg leading-relaxed">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg leading-relaxed">
          {success}
        </div>
      )}

      {token ? (
        /* Action Flow: Reset/Setup password using token */
        <form onSubmit={handleExecuteReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/75 uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-ink/15 rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/75 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-ink/15 rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] text-sm"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4A0E0E] hover:bg-[#3d0b0b] text-white font-semibold text-sm rounded-lg shadow transition duration-200 disabled:opacity-50"
          >
            {loading ? "Saving password..." : "Set Password"}
          </button>
        </form>
      ) : (
        /* Request Flow: Submit email to get link */
        <form onSubmit={handleRequestReset} className="space-y-4">
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
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4A0E0E] hover:bg-[#3d0b0b] text-white font-semibold text-sm rounded-lg shadow transition duration-200 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Setup Link"}
          </button>
        </form>
      )}

      {/* Footer Link */}
      <div className="mt-8 text-center text-xs text-ink/60">
        Back to{" "}
        <Link href="/sign-in" className="font-semibold text-[#4A0E0E] hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white border border-ink/10 rounded-2xl p-8 shadow-sm text-center">
          <p className="text-ink/60 text-sm">Loading page...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
