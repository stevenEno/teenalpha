import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Teen Alpha',
  description: 'Discover your startup path',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen-safe bg-white">
      {children}
    </div>
  );
}
