import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AIBlogger - AI-Powered Blog",
  description: "A modern blog powered by AI content generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Navbar />
        <main>{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} AIBlogger. Powered by Claude AI.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
