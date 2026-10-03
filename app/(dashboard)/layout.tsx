import { Sidebar } from '@/components/layout/Sidebar';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-smoke-white dark:bg-[#0a0a0a]">
      <Sidebar />
      {/* Main content area, offset by the 64-width (16rem) sidebar */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen no-scrollbar">
        {children}
      </main>
    </div>
  );
}