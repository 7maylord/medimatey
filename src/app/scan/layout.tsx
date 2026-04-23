import Sidebar from "@/components/layout/Sidebar";

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">{children}</main>
    </div>
  );
}
