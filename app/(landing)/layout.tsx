import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "./_components/Navbar";

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProviders>
      <div className="dark:bg-dark h-full">
        <Navbar />
        <main className="h-full pt-20">{children}</main>
      </div>
    </AppProviders>
  );
};
export default LandingLayout;
