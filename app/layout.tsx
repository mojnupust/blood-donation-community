import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blood Donation Community",
  description: "Find blood donors in your community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
