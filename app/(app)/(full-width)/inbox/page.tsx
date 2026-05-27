import { InboxPage } from "@/components/inbox/InboxPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InboxPage />
    </Suspense>
  );
}
