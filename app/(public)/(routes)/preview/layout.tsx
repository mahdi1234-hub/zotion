import { AppProviders } from "@/components/providers/app-providers";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProviders>
      <div className="dark:bg-dark h-full">{children}</div>
    </AppProviders>
  );
};
export default PublicLayout;
