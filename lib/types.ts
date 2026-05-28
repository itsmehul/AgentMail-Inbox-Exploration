export type AgentId = "jill" | "jack";

export interface AgentConfig {
  label: string;
  topbar: string;
  avatar: string;
  defaultNode: string;
}

export type BlockReason = "unclear_intent" | "delegation_stuck" | "failure";

export interface BlockResolutionOption {
  id: string;
  label: string;
  description?: string;
  requiresInput?: boolean;
  inputPlaceholder?: string;
}

export interface BlockedResolutionConfig {
  title: string;
  description: string;
  fixLink?: {
    label: string;
    href: string;
    hint?: string;
  };
  /** Pick-one wizard; optional free-text overrides selection when filled. */
  wizard?: {
    options: BlockResolutionOption[];
    allowCustomInstructions?: boolean;
    instructionsPlaceholder?: string;
  };
  /** Standalone instruction input when no wizard is shown. */
  instructions?: {
    placeholder: string;
    submitLabel: string;
  };
  submitLabel: string;
}

export interface BlockResolutionPayload {
  optionId?: string;
  optionInput?: string;
  instructions?: string;
}

export interface ThreadMeta {
  msgs: number;
  status: string;
  lastAction: string;
}

export interface Prospect {
  name: string;
  email: string;
  role: string;
  company: string;
  stage: "intro";
}

export interface ThreadMessage {
  from?: string;
  time?: string;
  body?: string;
  stage?: "intro" | "takehome" | "codereview" | "pmreview";
  agent?: boolean;
  caption?: string;
  approval?: boolean;
  sub?: string;
  when?: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subjectLine?: string;
  attachment?: { name: string; size: string; tag?: string };
  /** Jill-only whisper — visible in app, not sent to candidate. */
  internal?: boolean;
  /** Pending approval draft id (AgentMail live inbox). */
  draftId?: string;
  /** Role inbox that whispered to Jill when this draft was created. */
  whispererRole?: "hm" | "eng" | "jill";
}

export type PipelineStageId = "intro" | "takehome" | "codereview" | "pmreview";

export interface StageScoreEntry {
  score: number;
  reasoning: string;
}

export type StageScores = Partial<Record<PipelineStageId, StageScoreEntry>>;

export interface RubricRefinement {
  id: string;
  threadId: string;
  stage: PipelineStageId;
  previousScore: number;
  newScore: number;
  reasoning: string;
  addedAt: string;
}

export interface StageScoringRubric {
  stage: PipelineStageId;
  criteria: string;
  refinements: RubricRefinement[];
}

export interface ThreadInternalComment {
  id: string;
  author: string;
  initials: string;
  time: string;
  stage: PipelineStageId;
  body: string;
}

export interface Thread {
  id: string;
  folder: string;
  stages: string[];
  goal: string;
  from: string;
  time: string;
  subject: string;
  preview: string;
  tags: string[];
  userTags: string[];
  /** Set when jill-diy cannot proceed without intervention. */
  blockReason?: BlockReason;
  meta: ThreadMeta;
  stageScores?: StageScores;
  internalComments?: ThreadInternalComment[];
  messages: ThreadMessage[];
  prospect?: Prospect;
  candidateEmail?: string;
  /** inbound = candidate→Jill ack thread; pipeline = merged hiring thread */
  threadKind?: "inbound" | "pipeline";
  logicalThreadId?: string;
  inboxLinks?: { role: "jill" | "hm" | "eng"; inboxId: string; threadId: string }[];
}

export interface Folder {
  key: string;
  label: string;
  count: number;
  section: "main" | "stage" | "chat";
  badge?: boolean;
  badgeColor?: string;
  stage?: string;
}

export interface NodeConfig {
  name: string;
  subtitle?: string;
  type: "simple" | "subagent" | "tool";
  desc?: string;
  prompt?: string;
  llm?: string;
  voice?: string;
  eagerness?: string;
  tools?: string[];
  highStakes?: boolean;
}

export interface EdgeConfig {
  forward: {
    type: string;
    label: string;
    condition: string;
  };
}

export type InspectorTab = "general" | "kb" | "tools" | "tests" | "edges";

export interface ApprovalSubagent {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean;
}

export interface InboxOption {
  inboxId: string;
  addr: string;
  label: string;
  meta: string;
  active?: boolean;
}
