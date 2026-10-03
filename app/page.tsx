import { redirect } from 'next/navigation';

export default function RootPage() {
  // Instantly route users to the dashboard. 
  // NextAuth will automatically intercept and send them to /login if they aren't authenticated.
  redirect('/dashboard');
}