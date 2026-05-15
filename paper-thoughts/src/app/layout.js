import { Playfair_Display, DM_Sans, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import Navigation from "../components/Navigation";
import EasterEgg from "../components/EasterEgg";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["italic", "normal"]
});

export const metadata = {
  title: {
    default: "Paper Thoughts - The Literary Clubhouse",
    template: "%s | Paper Thoughts"
  },
  description: "An opinionated reading community spanning Zaria, Kaduna, and Abuja. We read heavily, debate fiercely, and never use PDFs.",
  keywords: ["Literary Clubhouse", "Book Club Nigeria", "Zaria", "Kaduna", "Abuja", "Reading Community", "Paper Thoughts"],
  openGraph: {
    title: "Paper Thoughts - The Literary Clubhouse",
    description: "We came for the books. We stayed for the chaos. Join the Archive.",
    url: "https://www.paperthoughts.org",
    siteName: "Paper Thoughts",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Paper Thoughts Literary Clubhouse"
      }
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paper Thoughts - The Literary Clubhouse",
    description: "An opinionated reading community spanning Zaria, Kaduna, and Abuja.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: "#4A0E0E",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          suppressHydrationWarning
          className={`${playfair.variable} ${dmSans.variable} ${lora.variable} font-sans antialiased bg-cream text-ink min-h-screen flex flex-col`}
        >
          <Navigation />
          <div className="flex-1 w-full">
            {children}
          </div>
          <footer className="bg-ink text-cream py-8 text-center border-t border-white/10 relative">
            <p className="font-display relative z-10">© {new Date().getFullYear()} Paper Thoughts. All rights reserved.</p>
            <p className="text-sm opacity-50 mt-2 font-sans relative z-10">We didn't read the terms and conditions either, but please play nice.</p>
            <EasterEgg />
          </footer>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
