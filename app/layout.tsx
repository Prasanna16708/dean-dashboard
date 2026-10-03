import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Providers } from '@/components/Providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Dean Dashboard',
  description: 'College Administration System',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} bg-smoke-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-300 no-scrollbar`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}