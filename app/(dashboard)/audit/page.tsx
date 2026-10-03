import { redirect } from 'next/navigation';

export default function AuditPageRedirect() {
  redirect('/dashboard');
}