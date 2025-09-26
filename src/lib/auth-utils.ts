import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';

/**
 * Get the current session on the server side
 */
export async function getCurrentSession() {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Require authentication for a server component
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/sign-in');
  }

  return session;
}

/**
 * Check if a user is an admin based on their email
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}