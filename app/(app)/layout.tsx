import fs from "fs";
import path from "path";
import { Topbar } from "@/components/layout/Topbar";
import { LeftNav } from "@/components/layout/LeftNav";
import { AppGrid } from "@/components/layout/AppGrid";
import { ChangesHelpButton } from "@/components/layout/ChangesHelpButton";
import { CreateInboxModal } from "@/components/modals/CreateInboxModal";
import { parseChangelogFromReadme } from "@/lib/changelog";

function getChangelog() {
  const raw = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf-8");
  return parseChangelogFromReadme(raw);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const changes = getChangelog();

  return (
    <>
      <Topbar />
      <AppGrid>
        <LeftNav />
        {children}
      </AppGrid>
      <CreateInboxModal />
      <ChangesHelpButton changes={changes} />
    </>
  );
}
