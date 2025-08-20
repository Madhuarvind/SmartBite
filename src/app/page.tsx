import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login, which will then handle routing to dashboard if authenticated
  redirect('/login');
}
