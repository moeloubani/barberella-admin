import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth-utils';

export default async function Home() {
  const session = await getCurrentSession();

  // If authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  // If not authenticated, redirect to sign-in
  redirect('/sign-in');
}
