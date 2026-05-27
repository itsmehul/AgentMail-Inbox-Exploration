import type { PipelineStageId, StageScoringRubric } from "@/lib/types";

export const SCORING_RUBRICS: Record<PipelineStageId, StageScoringRubric> = {
  intro: {
    stage: "intro",
    criteria:
      "Score the intro stage (1–10) on:\n• Response time — did the candidate reply within 48h?\n• Warmth & clarity — is the tone professional and welcoming?\n• Scheduling — were concrete slots offered or a calendar link sent?\n• HM engagement — did the HM follow up promptly after the intro?",
    refinements: [],
  },
  takehome: {
    stage: "takehome",
    criteria:
      "Score the take-home stage (1–10) on:\n• Instructions clarity — deadline, submission format, and contact for questions\n• Attachment accuracy — correct HM-approved take-home attached\n• Follow-up timing — nudge sent if no submission by deadline − 1 day\n• HM handoff — code reviewer named when HM requests it",
    refinements: [],
  },
  codereview: {
    stage: "codereview",
    criteria:
      "Score the code review stage (1–10) on:\n• Reviewer match — right colleague looped in for the stack\n• GitHub link extracted — repo URL pulled from thread without asking again\n• Calendar invite — slot confirmed and .ics sent to all parties\n• Context provided — reviewer gets a brief summary of take-home feedback",
    refinements: [],
  },
  pmreview: {
    stage: "pmreview",
    criteria:
      "Score the PM review stage (1–10) on:\n• PM match — appropriate product leader for the role level\n• Handoff summary — 4–6 sentence recap of prior stages included\n• Scheduling — slot proposed within 5 working days\n• HM visibility — HM kept on Cc throughout",
    refinements: [],
  },
};
