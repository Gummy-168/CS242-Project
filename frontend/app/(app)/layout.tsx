"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../components/AppHeader";
import Sidebar from "../components/Sidebar";
import { SubjectProvider } from "../components/SubjectContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const userId = window.localStorage.getItem("userId");
    if (!userId) {
      router.replace("/login");
      setIsAuthorized(false);
      setIsCheckingAuth(false);
      return;
    }

    setIsAuthorized(true);
    setIsCheckingAuth(false);
  }, [router]);

  if (isCheckingAuth || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#EFEFEF]" />
    );
  }

  return (
    <SubjectProvider>
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
    </SubjectProvider>
  );
}
