import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content area — offset by sidebar on desktop */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
