"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ModalProvider } from "@/components/providers/modal-provider";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { ClerkProvider } from "@clerk/nextjs";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { shadcn } from "@clerk/themes";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider
      appearance={{
        theme: shadcn,
      }}
    >
      <ConvexClientProvider>
        <EdgeStoreProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="zotion-theme-2"
          >
            <ToasterProvider />
            <ModalProvider />
            {children}
          </ThemeProvider>
        </EdgeStoreProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
};
