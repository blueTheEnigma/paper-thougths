import { Playfair_Display, DM_Sans, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
  title: "Paper Thoughts - Literary Clubhouse",
  description: "A living literary clubhouse in Zaria, Kaduna, Abuja, and anywhere with good taste.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
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
  );
}
