


import type { Metadata } from "next";
import "./globals.css";
import AuthLoader from "@/components/AuthLoader";

export const metadata: Metadata = {
  title: "FileClassify — Document Management System",
  description: "Professional file classification system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthLoader>{children}</AuthLoader>
      </body>
    </html>
  );
}