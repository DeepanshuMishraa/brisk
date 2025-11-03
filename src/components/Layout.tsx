import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 hidden dark:block backdrop-blur-2xl"
        style={{
          background: `
            radial-gradient(1200px 600px at 10% 0%, rgba(255,255,255,0.02), transparent 60%),
            radial-gradient(800px 600px at 80% 40%, rgba(255,255,255,0.015), transparent 60%),
            radial-gradient(600px 400px at 50% 120%, rgba(0,0,0,0.3), transparent 60%),
            rgba(0, 0, 0, 0.7)
          `,
        }}
      />
      <div
        className="absolute inset-0 block dark:hidden backdrop-blur-2xl"
        style={{
          background: `
            radial-gradient(1200px 600px at 10% 0%, rgba(255,255,255,0.08), transparent 60%),
            radial-gradient(800px 600px at 80% 40%, rgba(255,255,255,0.06), transparent 60%),
            radial-gradient(600px 400px at 50% 120%, rgba(0,0,0,0.1), transparent 60%),
            rgba(255, 255, 255, 0.85)
          `,
        }}
      />
      <div className="absolute inset-0 border border-gray-300/20 dark:border-white/8 rounded-none shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] pointer-events-none" />
      <div className="relative w-full max-w-3xl mx-auto flex flex-col h-screen px-6 py-6 z-10">
        {children}
      </div>
    </div>
  );
}
