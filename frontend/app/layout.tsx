import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Sarabun } from "next/font/google";
import "./globals.css";


const outfit = Outfit({
  subsets: ["latin"],
  weight: "400",
});

const sarabun = Sarabun({
  subsets: ["thai"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "cs242 python",
  description: "python",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${outfit.className} bg-[#F8F9FE]`} 
            style={{ fontFamily: `${outfit.style.fontFamily}, ${sarabun.style.fontFamily}` }}>
        {children}
      </body>
    </html>
  );
}
