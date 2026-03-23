import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SketchFlow Studio - 2D Animation',
  description: 'Create hand-drawn 2D animations with SketchFlow Studio.',
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
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-accent/30">
        {children}
      </body>
    </html>
  );
}
