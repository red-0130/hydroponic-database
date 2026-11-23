import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hydroponic Database',
  description: 'Hydroponic plant database and nutrient requirement reference for growers',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
