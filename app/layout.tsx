import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Import local fonts with proper variables
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

// Update metadata to match the new title and description
export const metadata: Metadata = {
  title: "Closy",
  description: "Your AI Fashion Hunter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Closy</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@500&family=Raleway:wght@500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/public/images/logo" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
