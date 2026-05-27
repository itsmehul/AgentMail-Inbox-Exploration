import { InspectorPanel } from "@/components/inspector/InspectorPanel";

export default function WithInspectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InspectorPanel />
    </>
  );
}
