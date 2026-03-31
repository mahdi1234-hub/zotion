"use client";

import { Spinner } from "@/components/spinner";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import Navigation from "./_components/Navigation";
import { SearchCommand } from "@/components/search-command";
import { AiChatWidget } from "@/components/ai-chat/ai-chat-widget";
import { AppProviders } from "@/components/providers/app-providers";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProviders>
      <MainLayoutInner>{children}</MainLayoutInner>
    </AppProviders>
  );
};

const MainLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="dark:bg-dark flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return redirect("/");
  }

  return (
    <div className="dark:bg-dark flex h-full">
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
      <AiChatWidget />
    </div>
  );
};
export default MainLayout;
