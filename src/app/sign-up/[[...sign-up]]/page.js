import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-24">
      <SignUp path="/sign-up" />
    </main>
  );
}
