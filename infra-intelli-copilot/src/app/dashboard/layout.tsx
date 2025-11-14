// src/app/dashboard/layout.tsx
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* The Sidebar is persistent and fixed */}
      <Sidebar />

      {/* Main content area that will scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* You could add a simple header here later if needed */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}