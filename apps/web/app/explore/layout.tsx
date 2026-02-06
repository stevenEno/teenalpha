import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Your First Dollar | Teen Alpha',
  description: 'Discover how to earn your first dollar online with AI-powered business paths tailored to your interests.',
  openGraph: {
    title: 'Explore Your First Dollar | Teen Alpha',
    description: 'Discover how to earn your first dollar online with AI-powered business paths tailored to your interests.',
    type: 'website',
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth check - this route is guest-accessible
  return <>{children}</>;
}
