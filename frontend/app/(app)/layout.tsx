import { Suspense } from "react";
import AppHeader from "../components/AppHeader";
import Sidebar from "../components/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Suspense
          fallback={
            <div className="h-[73px] bg-white border-b border-gray-100 sticky top-0 z-50" />
          }
        >
          <AppHeader />
        </Suspense>
        <div className="overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
