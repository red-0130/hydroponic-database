import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken, getAdminSecretPath, ADMIN_COOKIE_NAME } from '@/lib/auth';
import AdminPortalContainer from '@/components/admin/AdminPortalContainer';

export const dynamic = 'force-dynamic';

interface AdminPageProps {
  params: Promise<{ adminSecretPath: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { adminSecretPath } = await params;
  const expectedSecretPath = getAdminSecretPath();

  // If secret path does not match configured ADMIN_SECRET_PATH, return 404
  if (adminSecretPath !== expectedSecretPath) {
    notFound();
  }

  // Check admin session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = verifySessionToken(sessionToken);

  return (
    <AdminPortalContainer
      initialAuthenticated={isAuthenticated}
      secretPath={adminSecretPath}
    />
  );
}
