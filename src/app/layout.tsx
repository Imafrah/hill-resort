import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Misty Peaks Estate | Luxury Coffee Estate Resort, Chikkamagaluru",
  description:
    "Nestled among coffee plantations in the Western Ghats. 76 rooms and villas with panoramic mountain views. Book direct for the best rates.",
  keywords: [
    "Chikkamagaluru resort",
    "coffee estate stay",
    "luxury resort Karnataka",
    "hill station resort",
    "Western Ghats hotel",
    "wedding venue Chikkamagaluru",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--cream)] text-gray-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
