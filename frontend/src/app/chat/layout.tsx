import Sidebar from "@/components/layout/Sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 h-screen flex flex-col pb-16 md:pb-0">{children}</main>
    </div>
  );
}
