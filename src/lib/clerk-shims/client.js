"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    isSignedIn: status === "authenticated",
    isLoaded: status !== "loading",
    userId: session?.user?.id || null,
  };
}

export function useUser() {
  const { data: session, status } = useSession();
  
  if (status !== "authenticated" || !session?.user) {
    return {
      user: null,
      isLoaded: status !== "loading",
    };
  }

  const nameParts = (session.user.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    user: {
      id: session.user.id,
      fullName: session.user.name,
      firstName,
      lastName,
      primaryEmailAddress: {
        emailAddress: session.user.email,
      },
      emailAddresses: [
        { emailAddress: session.user.email }
      ],
    },
    isLoaded: true,
  };
}

export function UserButton({ afterSignOutUrl }) {
  const handleSignOut = () => {
    signOut({ callbackUrl: afterSignOutUrl || "/" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs font-bold font-sans uppercase tracking-wider text-ink/75 hover:text-burgundy px-3 py-1.5 rounded-xl border border-sage/20 bg-white/80 hover:bg-cream transition-all shadow-sm cursor-pointer whitespace-nowrap"
      title="Click to sign out"
    >
      Sign Out
    </button>
  );
}

export function SignOutButton({ children, afterSignOutUrl }) {
  const handleSignOut = () => {
    signOut({ callbackUrl: afterSignOutUrl || "/" });
  };

  if (children) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: (e) => {
          if (children.props.onClick) {
            children.props.onClick(e);
          }
          handleSignOut();
        }
      });
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs font-bold font-sans uppercase tracking-wider text-ink/75 hover:text-burgundy px-3 py-1.5 rounded-xl border border-sage/20 bg-white/80 hover:bg-cream transition-all shadow-sm cursor-pointer whitespace-nowrap"
    >
      Sign Out
    </button>
  );
}

export function ClerkProvider({ children }) {
  return <>{children}</>;
}
