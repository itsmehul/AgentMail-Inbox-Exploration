# Jill DIY — Email Orchestrator

Prototype for monitoring hiring-pipeline email threads, approving agent drafts, unblocking stuck automation, and scoring pipeline stages. Built as a take-home exercise extending the original HTML mock (`jill-diy-v12 (1).html`).

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to `/inbox`.

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`.

## Tech stack

- **Next.js 15** (App Router, Turbopack in dev)
- **React 19**
- **Zustand** for client-side state
- Plain CSS (no component library)
- Static mock data — no backend API

## App structure

| Route | Description |
|-------|-------------|
| `/inbox` | Three-column inbox: folders, thread list, thread detail |
| `/workflow` | Visual editor for Jill subagent workflow nodes and edges |
| `/settings` | Inbox selector and approval subagent configuration |
| `/agent` | Agent identity settings (Jack placeholder) |

Key directories:

- `components/inbox/` — thread list, detail, approval compose, blocked resolution, search
- `lib/inbox/` — stage grouping, blocked-thread config, approval diff, org-user matching
- `stores/` — Zustand stores for inbox, rubrics, memory, workflow, settings
- `lib/mock/` — sample threads, org users, scoring rubrics, workflow graph

## Changes

1. Reverse scroll — newest messages anchor at the bottom, Gmail-style
2. Collapsed message list — older messages in a stage collapse behind a divider row
3. Collapse stage-wise — threads grouped by pipeline stage (intro → takehome → codereview → pmreview)
4. Familiarity and simplicity of Gmail — three-column layout, thread rows, compose-for-approval card
5. Scoring per stage, feedback on scoring — click stage score chips to review Jill's reasoning and submit corrections that refine the rubric
6. Added a 'blocked' section where Jill can request for help from the relevant user
7. Show component that makes adding input easier for the user when Jill is blocked by showing suggestion and places to perform action
8. Agentic search/Command center similar to Warp — search mode toggle with agent placeholder (full chat UI not yet built)
9. User specific search similar to Linear — multi-select team-member filter in the inbox toolbar
10. If there is any modifications to the approval card and then sent, the user is asked if they want to commit this change to memory
11. Internal comments that can be tied to the thread and the stage the user is in to declutter the main thread

---

## Feature details

### Reverse scroll

Thread messages use `flex-direction: column-reverse` so the viewport opens at the newest content. Stage groups and messages are rendered in reverse DOM order to preserve chronological reading top-to-bottom. Switching threads resets scroll to the visual bottom.

### Stage-wise collapse

Each thread is split into pipeline stages. The active (last) stage is always expanded; earlier stages show a clickable divider with the stage name, message count, and optional score chip. Click to expand or collapse older conversation history without losing context.

### Gmail-like inbox UX

- Folder sidebar (All, Awaiting your approval, Blocked, etc.)
- Thread list with from, subject, preview, tags, and timestamps
- Message bubbles with agent/human styling
- Approval compose card with To/Cc/Bcc chips, editable body, attachment row, and Send — mirrors Gmail's reply/compose patterns

Try **Awaiting your approval** → `thr_single_01` for the full approval + scoring flow.

### Stage scoring and rubric feedback

Jill scores each pipeline stage (0–10) with written reasoning. Scores appear on collapse dividers and as an average in the thread header. Opening a score chip launches a dialog showing the current rubric, Jill's reasoning, and recent refinements. Submitting a corrected score requires user reasoning, which is appended to the rubric store for future scoring.

### Blocked threads

When Jill cannot proceed (unclear intent, delegation stuck, or failure), the thread moves to the **Blocked** folder with a reason tag. Four mock blocked threads cover orchestrator ambiguity, tag loops, scheduler escalation, and API failures.

Open **Blocked** → `thr_blocked_01` to see the resolution flow.

### Blocked resolution wizard

At the bottom of a blocked thread, a resolution card explains why Jill is stuck and offers:

- **Fix links** — deep links to `/workflow` or `/settings` where the underlying issue can be addressed
- **Wizard options** — radio choices (e.g. answer on behalf of candidate, retry send, assign backup reviewer)
- **Custom instructions** — free-text override when preset options don't fit
- **Conditional inputs** — extra fields when a choice needs additional data (e.g. backup reviewer email)

Submitting resolves the block: folder updates, status clears, and an agent "Unblocked" message is appended.

### Search modes

The inbox toolbar supports two modes via a toggle:

- **Query** — keyword search across from, subject, preview, status, and tags
- **Agent** — placeholder for a Warp-style command center; currently shows all threads (search string ignored). A dedicated chat window for multi-item actions is planned but not yet implemented.

### Team-member filter (Linear-style)

A multi-select next to the search bar filters threads by org team member (Rohit, Devon, Sam, Mira, Lakshmi). Matching scans thread metadata, messages, comments, and recipients against each user's name, email, and aliases. Works alongside query search; selected members show a count badge.

### Approval edits and memory commit

When a user edits an approval draft (recipients or body) and clicks Send, the app detects changes against the original snapshot. If unchanged, the draft is sent immediately. If modified, a dialog asks whether to **send without saving** or **save to memory & send**. Saved entries are stored per thread, subagent, and stage in the memory store for future agent learning (consumption in downstream flows is not yet wired).

The approval card also supports an optional **Promote to next stage** checkbox on send.

### Other features

- **Internal comments** — stage-grouped side panel for team notes on a thread
- **User tags** — add/remove label chips in the thread header
- **Workflow editor** — canvas for Jill subagent nodes with an inspector panel for node/edge config
- **Changes help** — the **?** FAB in the app reads the numbered list above
