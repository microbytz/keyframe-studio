import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Keyframe Studio - 2D Animation',
  description: 'Create hand-drawn 2D animations with Keyframe Studio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />

        {/* Adsterra Pop-Under Script */}
        <Script 
          src="https://pl29029576.profitablecpmratenetwork.com/f1/f0/d4/f1f0d4771e816260a95c95d69d12f208.js" 
          strategy="afterInteractive" 
        />

        {/* 
          Placeholder for Adsterra Social Bar: 
          If you have another script for the Social Bar, 
          you can add it right here using another <Script /> tag.
        */}
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-accent/30">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
