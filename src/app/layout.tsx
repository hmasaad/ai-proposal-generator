import type { Metadata } from "next";
import { DM_Sans, Fraunces, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-urdu",
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "Proposal Agent",
  description:
    "Turn RFPs, emails, and meeting notes into a scoped software proposal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} ${urdu.variable} ${arabic.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
