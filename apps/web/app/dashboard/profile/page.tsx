import { redirect } from 'next/navigation';

// Canonical profile route is /profile. This dupe used to render its own
// teen-only social-media UI; both pages drifted. Redirecting here keeps any
// stale bookmarks alive while there is one source of truth.
export default function DashboardProfileRedirect() {
  redirect('/profile');
}
