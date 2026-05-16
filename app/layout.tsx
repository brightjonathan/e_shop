import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AppContextProvider } from "@/Context/AppContextProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eshop App - BrightJonathan",
  description: "eShop is an online platform where users can browse, buy, and sell products. It typically includes product listings, a shopping cart, secure checkout, and order tracking, making shopping convenient and accessible from anywhere",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.className} h-full text-gray-700 antialiased`}
    >
     <body className="min-h-full flex flex-col">
        <AppContextProvider>
         <Toaster />
         {children}
        </AppContextProvider>
        </body>
    </html>
  );
}
