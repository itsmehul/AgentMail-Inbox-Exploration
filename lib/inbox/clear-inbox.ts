import { createAgentMailClient } from "@/lib/agentmail/client";
import { resolveAllRoleInboxes } from "@/lib/agentmail/config";
import { getDb } from "@/lib/db/sqlite";

export function clearLocalInboxDb(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM approval_drafts;
    DELETE FROM messages;
    DELETE FROM thread_inbox_links;
    DELETE FROM threads;
    DELETE FROM processed_events;
  `);
}

export async function deleteAllThreadsInInbox(inboxId: string): Promise<number> {
  const client = createAgentMailClient();
  let pageToken: string | undefined;
  let deleted = 0;

  do {
    const listed = await client.inboxes.threads.list(inboxId, {
      limit: 100,
      pageToken,
      includeTrash: true,
      includeSpam: true,
      includeBlocked: true,
    });

    for (const thread of listed.threads) {
      const threadId = String(thread.threadId);
      await client.inboxes.threads.delete(inboxId, threadId, { permanent: true });
      deleted += 1;
    }

    pageToken = listed.nextPageToken;
  } while (pageToken);

  return deleted;
}

export type ClearInboxResult = {
  agentMailDeleted: number;
  byRole: { role: string; email: string; deleted: number }[];
};

export async function clearAgentMailAndLocalDb(): Promise<ClearInboxResult> {
  const inboxes = await resolveAllRoleInboxes();
  const byRole: ClearInboxResult["byRole"] = [];
  let agentMailDeleted = 0;

  for (const { role, inboxId, email } of inboxes) {
    const deleted = await deleteAllThreadsInInbox(inboxId);
    agentMailDeleted += deleted;
    byRole.push({ role, email, deleted });
  }

  clearLocalInboxDb();

  return { agentMailDeleted, byRole };
}
