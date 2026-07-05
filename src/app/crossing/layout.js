export const metadata = {
  title: "Relics of the Crossing | Paper Thoughts",
  description: "Welcome to the Second Chapter. Sign the Register, cross the Four Realms, and claim your personalized digital Relic.",
  openGraph: {
    title: "Relics of the Crossing | Paper Thoughts",
    description: "Welcome to the Second Chapter. Sign the Register, cross the Four Realms, and claim your personalized digital Relic.",
    url: "https://www.paperthoughts.org/crossing",
    siteName: "Paper Thoughts",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Relics of the Crossing | Paper Thoughts"
      }
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Relics of the Crossing | Paper Thoughts",
    description: "Welcome to the Second Chapter. Sign the Register, cross the Four Realms, and claim your personalized digital Relic.",
    images: ["/og-image.png"],
  },
};

export default function CrossingLayout({ children }) {
  return children;
}
