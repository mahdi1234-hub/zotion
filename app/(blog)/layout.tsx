import { Navbar } from "../(landing)/_components/Navbar";
import { Footer } from "../(landing)/_components/Footer";

const BlogLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="dark:bg-dark min-h-full">
      <Navbar />
      <main className="min-h-[calc(100vh-160px)] pt-20">{children}</main>
      <Footer />
    </div>
  );
};

export default BlogLayout;
