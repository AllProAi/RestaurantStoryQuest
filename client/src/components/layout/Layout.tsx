import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#FFF5E1]">
      <header className="bg-[#009B3A] text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">
            Jamaican Restaurant Story
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-[#000000] text-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2024 Jamaican Restaurant Story</p>
        </div>
      </footer>
    </div>
  );
}
