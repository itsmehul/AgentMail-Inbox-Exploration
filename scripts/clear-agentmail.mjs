import { AgentMailClient } from "agentmail";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const apiKey = process.env.AGENTMAIL_API_KEY?.trim();
if (!apiKey) {
  console.error("AGENTMAIL_API_KEY is not set");
  process.exit(1);
}

const roleEmails = [
  ["jill", process.env.JILL_INBOX_EMAIL],
  ["hm", process.env.HM_INBOX_EMAIL],
  ["eng", process.env.ENG_INBOX_EMAIL],
]
  .map(([role, email]) => [role, email?.trim().toLowerCase()])
  .filter(([, email]) => email);

if (roleEmails.length === 0) {
  console.error("No role inbox emails configured");
  process.exit(1);
}

const client = new AgentMailClient({ apiKey });

async function resolveInboxId(email) {
  const result = await client.inboxes.list({ limit: 100 });
  const inbox = result.inboxes.find((row) => String(row.email).toLowerCase() === email);
  if (!inbox) throw new Error(`No inbox for ${email}`);
  return { inboxId: String(inbox.inboxId), email: String(inbox.email) };
}

async function deleteAllThreads(inboxId, label) {
  let pageToken;
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
      console.log(`  deleted thread ${threadId}`);
    }

    pageToken = listed.nextPageToken;
  } while (pageToken);

  console.log(`${label}: ${deleted} thread(s) deleted`);
  return deleted;
}

function clearLocalDb() {
  const dbPath = path.join(process.cwd(), ".data", "inbox.db");
  if (!fs.existsSync(dbPath)) {
    console.log("Local DB: none (skipped)");
    return;
  }

  const db = new Database(dbPath);
  db.exec(`
    DELETE FROM messages;
    DELETE FROM thread_inbox_links;
    DELETE FROM threads;
    DELETE FROM processed_events;
  `);
  db.close();
  console.log("Local DB: cleared threads and messages");
}

let total = 0;
for (const [role, email] of roleEmails) {
  const { inboxId, email: resolved } = await resolveInboxId(email);
  console.log(`\n${role} (${resolved})`);
  total += await deleteAllThreads(inboxId, role);
}

clearLocalDb();
console.log(`\nDone. ${total} thread(s) removed from AgentMail.`);
