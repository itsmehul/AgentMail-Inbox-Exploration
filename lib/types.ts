export type AgentId = "jill" | "jack";

export interface AgentConfig {
  label: string;
  topbar: string;
  avatar: string;
  defaultNode: string;
}

export interface ThreadMeta {
  msgs: number;
  status: string;
  lastAction: string;
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
  meta: ThreadMeta;
  stageScores?: StageScores;
  internalComments?: ThreadInternalComment[];
  messages: ThreadMessage[];
}

export interface Folder {
  key: string;
  label: string;
  count: number;
  section: "main" | "stage";
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
  addr: string;
  label: string;
  meta: string;
  active?: boolean;
}
