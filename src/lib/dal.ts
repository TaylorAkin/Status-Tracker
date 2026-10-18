import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from './auth';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

/** The signed-in user, narrowed to what pages need, or null. Call inside a <Suspense> boundary. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
}

/** The signed-in user; redirects to sign-in when there is none. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  return user;
}
