import { AppGrid } from "@/components/layout/AppGrid";
import { ChangesHelpButton } from "@/components/layout/ChangesHelpButton";
import { LeftNav } from "@/components/layout/LeftNav";
import { Topbar } from "@/components/layout/Topbar";
import { CreateInboxModal } from "@/components/modals/CreateInboxModal";
import { parseChangelogFromReadme } from "@/lib/changelog";
import fs from "fs";
import path from "path";

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
