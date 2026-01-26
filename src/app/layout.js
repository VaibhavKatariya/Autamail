import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Autamail",
  description:
    "Why do things manually in 2 minutes when you can spend hours automating them? 😏",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link
        rel="icon"
        type="image/png"
        href="https://icons.iconarchive.com/icons/dtafalonso/win-10x/128/Email-icon.png"
      />
      <body
        className={`${geistSans.variable} dark text-white ${geistMono.variable} antialiased`}
      >
        <Toaster richColors position="top-right" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
