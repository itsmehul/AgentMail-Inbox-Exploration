import { Topbar } from "@/components/layout/Topbar";
import { LeftNav } from "@/components/layout/LeftNav";
import { AppGrid } from "@/components/layout/AppGrid";
import { CreateInboxModal } from "@/components/modals/CreateInboxModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <AppGrid>
        <LeftNav />
        {children}
      </AppGrid>
      <CreateInboxModal />
    </>
  );
}
