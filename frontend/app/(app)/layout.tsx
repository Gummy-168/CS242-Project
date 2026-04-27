import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}