import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: 'GroceryFarm — Shared Grocery Lists',
  description: 'Create and share grocery lists with your family. No sign-up needed.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GroceryFarm',
  },
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
