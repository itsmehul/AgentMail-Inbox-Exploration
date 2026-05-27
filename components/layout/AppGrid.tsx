"use client";

import { usePathname } from "next/navigation";

export function AppGrid({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const withInspector = pathname === "/workflow";
  return (
    <div className={`app ${withInspector ? "app-with-inspector" : "app-full-width"}`}>{children}</div>
  );
}
