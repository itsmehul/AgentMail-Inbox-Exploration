export const NODES = {
  "start": {
    "name": "Start",
    "subtitle": "Entry point",
    "type": "simple",
    "desc": "Workflow entry. Triggered by inbound email webhook from AgentMail."
  },
  "end": {
    "name": "End",
    "subtitle": "Workflow complete",
    "type": "simple",
    "desc": "Conversation turn complete. Workflow waits for the next inbound email to start again."
  },
  "orchestrator": {
    "name": "Orchestrator",
    "subtitle": "Subagent · entry node",
    "type": "subagent",
    "prompt": "You are the routing orchestrator for Jack, the candidate-side recruiting email agent.\n\nEach invocation you receive: the full email thread (from cache), the candidate's profile, active applications, and any open Bridge intro_requests.\n\nChoose exactly one routing tool to delegate the reply. Do not write the reply yourself. If the intent is unclear, default to \"Asking about status\".",
    "llm": "Claude Sonnet 4",
    "voice": "Hans Wilmar",
    "eagerness": "Normal"
  },
  "intake": {
    "name": "Jack-Intake",
    "subtitle": "Subagent",
    "type": "subagent",
    "prompt": "You handle first contact with new candidates.\n\nWhen a candidate emails for the first time, or sends a resume, your job is to:\n· Parse the resume and extract structured profile fields\n· Ask any missing onboarding questions (location, comp expectations, role preferences)\n· Confirm the candidate's consent to be matched with employers",
    "llm": "Claude Sonnet 4",
    "voice": "Hans Wilmar",
    "eagerness": "Normal",
    "tools": [
      "parse_resume",
      "create_candidate_profile",
      "request_consent"
    ]
  },
  "updater": {
    "name": "Jack-Updater",
    "subtitle": "Subagent",
    "type": "subagent",
    "prompt": "You answer candidates' questions about the status of their applications.\n\nAlways pull the truth from the ATS. Never invent progress, dates, or interviewer feedback. If you don't have an update, say so honestly and offer to check back in a few days.",
    "llm": "Claude Sonnet 4",
    "voice": "Hans Wilmar",
    "eagerness": "Normal",
    "tools": [
      "get_application_status",
      "list_active_applications"
    ]
  },
  "coach": {
    "name": "Jack-Coach",
    "subtitle": "Subagent",
    "type": "subagent",
    "prompt": "You coach candidates through interview prep.\n\nPull the JD and any known interview-stage details. Tailor your advice to the specific company and role. Offer practice questions, suggest STAR-format answers, and review resume bullets when asked.",
    "llm": "Claude Sonnet 4",
    "voice": "Hans Wilmar",
    "eagerness": "High",
    "tools": [
      "get_jd",
      "get_interview_history",
      "generate_practice_questions"
    ]
  },
  "scheduler": {
    "name": "Jack-Scheduler",
    "subtitle": "Subagent",
    "type": "subagent",
    "prompt": "You coordinate interview scheduling.\n\nPropose 3 time slots in the candidate's timezone that work for the interview panel. Confirm the chosen slot. Send calendar invites to all parties.",
    "llm": "Claude Sonnet 4",
    "voice": "Hans Wilmar",
    "eagerness": "High",
    "tools": [
      "get_candidate_calendar",
      "get_panel_availability",
      "send_calendar_invite"
    ]
  },
  "negotiator": {
    "name": "Jack-Negotiator",
    "subtitle": "Subagent · high-stakes",
    "type": "subagent",
    "highStakes": true,
    "prompt": "You help candidates review offers and draft counter-offers.\n\nBe precise about comp, equity, vesting, and benefits. Cite the source documents. Drafts always route to a human reviewer before sending — never assume your numbers are correct without a check.",
    "llm": "Claude Sonnet 4",
    "voice": "Hans Wilmar",
    "eagerness": "Cautious",
    "tools": [
      "get_offer_details",
      "fetch_market_comp_data",
      "draft_counter_offer"
    ]
  },
  "guardian_legacy_removed": {},
  "send_legacy_removed": {},
  "jill_orchestrator": {
    "name": "Orchestrator",
    "subtitle": "Subagent · entry node",
    "type": "subagent",
    "prompt": "You are jill-diy, the orchestrator of a hiring-pipeline email agent.\n\nYou are added to a multi-party email thread that includes the hiring manager (HM) and one or more candidates. You DO NOT have an external system of record — your only context is this email thread itself.\n\nOn every inbound email you receive: the full thread, and the latest message.\n\nYour job: read the latest message (usually from the HM) and pick exactly one stage subagent to handle the reply. The stage subagents act ON the thread.\n\nRouting rules — use the thread history to disambiguate:\n· If the HM says \"intro <names>\" and an intro hasn't happened yet → Intro-Setter\n· If the HM says \"send <X> the take-home\" and X has finished intro → TakeHome-Sender\n· If the HM says \"have <colleague> code-review <X>\" and X has submitted a take-home → CodeReview-Scheduler\n· If the HM says \"loop in <PM> for the PM round with <X>\" → PMReview-Scheduler\n· If the HM is asking \"where are we\" / \"what's pending\" → Status-Reporter\n· If the HM says \"I'll take it from here\" → Handoff\n\nNever invent a stage. If the thread shows a candidate hasn't done intro yet, you can't send a take-home — push back to the HM politely.\n\nYou are stateless across threads. The thread is the only memory you have.",
    "llm": "Claude Sonnet 4",
    "eagerness": "Cautious"
  },
  "jill_intro": {
    "name": "Intro-Setter",
    "subtitle": "Pipeline stage · intro",
    "type": "subagent",
    "prompt": "You introduce candidates to the hiring manager.\n\nTriggered when the HM picks candidates from a shortlist email (sent earlier by jackandjill.ai or another recruiter) and replies with names like \"let's intro Priya and Marcus\".\n\nFor each named candidate:\n· Start a fresh email thread (one per candidate)\n· Cc the HM and jill-hm@diy.ai\n· Use a warm, professional intro template\n· Reference the role from the original shortlist context\n· Suggest 2-3 time slots for a 20-min intro call\n\nNever start a thread for a candidate the HM didn't explicitly name.",
    "llm": "Claude Sonnet 4",
    "eagerness": "Normal",
    "tools": [
      "start_new_thread",
      "compose_intro_email",
      "suggest_intro_slots"
    ]
  },
  "jill_takehome": {
    "name": "TakeHome-Sender",
    "subtitle": "Pipeline stage · take-home",
    "type": "subagent",
    "prompt": "You send take-home assignments to candidates the HM has chosen.\n\nTriggered when the HM, replying in a candidate's intro thread, says something like \"send Priya the backend take-home\" or \"give Marcus the v2 frontend assignment\".\n\nFor the named candidate:\n· Find the right take-home document in the Knowledge Base by name\n· Reply in the same thread, addressing the candidate directly\n· Attach the take-home PDF\n· Include the HM's WhatsApp number for clarifying questions\n· State the deadline (default: 5 calendar days unless HM specified otherwise)\n· Ask the candidate to reply with the GitHub repo link when done\n\nNever invent a take-home name. If the HM-named take-home isn't in the KB, ask the HM to clarify or upload it.",
    "llm": "Claude Sonnet 4",
    "eagerness": "Normal",
    "tools": [
      "lookup_takehome_by_name",
      "attach_file",
      "send_reply_with_attachment"
    ]
  },
  "jill_codereview": {
    "name": "CodeReview-Scheduler",
    "subtitle": "Pipeline stage · code review",
    "type": "subagent",
    "prompt": "You schedule code-review rounds with internal colleagues.\n\nTriggered when the HM, after a candidate has submitted a GitHub link to a take-home, says \"have Devon code-review Priya's submission\" or \"Sam can review Marcus's repo\".\n\nFor the named candidate + colleague:\n· Cc the named colleague on the existing thread\n· Share the candidate's GitHub link (pull from earlier in the thread)\n· Propose 3 time slots that respect the colleague's typical availability\n· Ask the colleague to confirm a slot and prepare 4-5 questions\n· Once confirmed, send a calendar invite to candidate + colleague + HM\n\nNever schedule with a colleague the HM didn't name.",
    "llm": "Claude Sonnet 4",
    "eagerness": "Normal",
    "tools": [
      "get_colleague_availability",
      "extract_github_link_from_thread",
      "send_calendar_invite"
    ]
  },
  "jill_pmreview": {
    "name": "PMReview-Scheduler",
    "subtitle": "Pipeline stage · PM review",
    "type": "subagent",
    "prompt": "You schedule product-review rounds with the PM the HM has chosen.\n\nTriggered when the HM, after code review is complete, says \"loop in Mira for the PM round with Priya\" or \"set up a PM round with Devon as the interviewer\".\n\nFor the named candidate + PM:\n· Cc the PM on the existing thread\n· Share a brief recap of intro + take-home + code-review feedback (pull from earlier in the thread)\n· Propose 3 time slots\n· Once confirmed, send a calendar invite\n\nNever schedule with a PM the HM didn't name.",
    "llm": "Claude Sonnet 4",
    "eagerness": "Normal",
    "tools": [
      "get_colleague_availability",
      "summarize_thread_for_handoff",
      "send_calendar_invite"
    ]
  },
  "jill_status": {
    "name": "Status-Reporter",
    "subtitle": "Utility · read-only",
    "type": "subagent",
    "prompt": "You answer the HM's status questions about candidates and the pipeline.\n\nTriggered when the HM asks \"where are we with Priya?\", \"what's pending?\", \"any candidates waiting on me?\".\n\n· Read the cached thread(s) for the candidates in question\n· Summarize current stage (intro / take-home / code-review / PM-review / waiting on HM / no movement in X days)\n· Surface anything that looks blocked or stale\n· Never invent stages — if you can't tell from the thread, say so\n\nRead-only. You don't move anyone forward.",
    "llm": "Claude Sonnet 4",
    "eagerness": "Normal",
    "tools": [
      "list_active_threads",
      "summarize_thread_stage"
    ]
  },
  "jill_handoff": {
    "name": "Handoff",
    "subtitle": "Pipeline stage · exit",
    "type": "subagent",
    "prompt": "You exit a candidate thread gracefully when the HM is ready to take over directly.\n\nTriggered when the HM says \"I'll take it from here\", \"thanks jill, taking this over\", \"remove jill from this\".\n\n· Post a brief recap of the stages completed\n· Confirm jill-diy is stepping out\n· Remove jill-hm@diy.ai from any future Cc\n· Archive the thread in our cache (HM can still reply normally; jill-diy just stops responding)",
    "llm": "Claude Sonnet 4",
    "eagerness": "Cautious",
    "tools": [
      "post_recap",
      "remove_self_from_thread",
      "archive_thread"
    ]
  }
} as const;

export const EDGES = {
  "webhook": {
    "forward": {
      "type": "Event trigger",
      "label": "New email received",
      "condition": "Fires automatically when AgentMail webhook posts a message.received event to our endpoint."
    }
  },
  "route_intake": {
    "forward": {
      "type": "LLM Condition",
      "label": "New candidate or resume",
      "condition": "The sender is a candidate Jack has never spoken to before, OR the message contains a resume attachment, OR this is the first email in the thread."
    }
  },
  "route_status": {
    "forward": {
      "type": "LLM Condition",
      "label": "Asking about status",
      "condition": "The candidate is asking about the progress of one of their applications. Phrases like \"any update\", \"have you heard back\", \"where am I in the process\". This is also the safe default if the intent is ambiguous."
    }
  },
  "route_coach": {
    "forward": {
      "type": "LLM Condition",
      "label": "Interview prep",
      "condition": "The candidate is asking for help preparing for an upcoming interview, wants resume feedback, or wants to practice answering questions."
    }
  },
  "route_schedule": {
    "forward": {
      "type": "LLM Condition",
      "label": "Scheduling",
      "condition": "The candidate is proposing, confirming, or rescheduling an interview slot. Time references like \"Tuesday at 3pm\", \"I am free next week\"."
    }
  },
  "route_negotiate": {
    "forward": {
      "type": "LLM Condition",
      "label": "Offer or negotiation",
      "condition": "An offer has been extended and the candidate has questions about compensation, equity, benefits, or wants help drafting a counter-offer."
    }
  },
  "jill_webhook": {
    "forward": {
      "type": "Event trigger",
      "label": "New email received",
      "condition": "Fires when AgentMail webhook posts a message.received event for jill-hm@diy.ai. Could be a reply from the HM, the candidate, or a colleague — orchestrator figures out who from the thread."
    }
  },
  "jill_route_intro": {
    "forward": {
      "type": "LLM Condition",
      "label": "Intro candidates",
      "condition": "The HM is naming candidates from a recently-received shortlist and asking jill-diy to set up intro calls. Phrases: \"let's intro X and Y\", \"set up calls with X\", \"reach out to A, B, C\". Only valid if the thread shows an external shortlist was just sent in."
    }
  },
  "jill_route_takehome": {
    "forward": {
      "type": "LLM Condition",
      "label": "Send take-home",
      "condition": "The HM, replying in a candidate's intro thread, is asking us to send a take-home assignment. Phrases: \"send Priya the backend take-home\", \"give X the v2 frontend assignment\". Take-home name must match one in the Knowledge Base."
    }
  },
  "jill_route_codereview": {
    "forward": {
      "type": "LLM Condition",
      "label": "Schedule code review",
      "condition": "The HM is naming a colleague to code-review a candidate's submission. Phrases: \"have Devon code-review X\", \"Sam can review Marcus's repo\". Only valid if the candidate has submitted a GitHub link earlier in the thread."
    }
  },
  "jill_route_pmreview": {
    "forward": {
      "type": "LLM Condition",
      "label": "Schedule PM review",
      "condition": "The HM is naming a PM to run the PM round. Phrases: \"loop in Mira for the PM round with X\", \"set up PM round with Devon as interviewer\". Only valid if code-review feedback exists in the thread."
    }
  },
  "jill_route_status": {
    "forward": {
      "type": "LLM Condition",
      "label": "Where are we with X?",
      "condition": "The HM is asking for a status update. Phrases: \"where are we with Priya\", \"what's pending\", \"any candidates blocked on me\", \"status check\". Read-only — jill-diy does not advance any stage."
    }
  },
  "jill_route_handoff": {
    "forward": {
      "type": "LLM Condition",
      "label": "HM takes over",
      "condition": "The HM signals they want to take the thread over directly. Phrases: \"I'll take it from here\", \"thanks jill, taking over\", \"remove jill from this thread\"."
    }
  }
} as const;

export const KB_BY_NODE = {
  "jill_orchestrator": [],
  "jill_intro": [
    {
      "name": "intro-email-template.md",
      "size": "4 KB",
      "updated": "1 week ago"
    }
  ],
  "jill_takehome": [
    {
      "name": "take-home-backend-v3.pdf",
      "size": "420 KB",
      "updated": "yesterday",
      "tag": "HM-approved"
    },
    {
      "name": "take-home-frontend-v2.pdf",
      "size": "380 KB",
      "updated": "yesterday",
      "tag": "HM-approved"
    },
    {
      "name": "take-home-ml-v1.pdf",
      "size": "510 KB",
      "updated": "3 days ago",
      "tag": "HM-approved"
    }
  ],
  "jill_codereview": [
    {
      "name": "code-review-rubric.md",
      "size": "6 KB",
      "updated": "2 weeks ago"
    }
  ],
  "jill_pmreview": [
    {
      "name": "pm-round-question-bank.md",
      "size": "11 KB",
      "updated": "1 month ago"
    }
  ],
  "jill_status": [],
  "jill_handoff": [
    {
      "name": "handoff-recap-template.md",
      "size": "2 KB",
      "updated": "2 weeks ago"
    }
  ]
} as const;

export const TOOLS_BY_NODE = {
  "jill_orchestrator": [
    "route_intro",
    "route_takehome",
    "route_codereview",
    "route_pmreview",
    "route_status",
    "route_handoff"
  ],
  "jill_intro": [
    "start_new_thread",
    "compose_intro_email",
    "suggest_intro_slots"
  ],
  "jill_takehome": [
    "lookup_takehome_by_name",
    "attach_file",
    "send_reply_with_attachment"
  ],
  "jill_codereview": [
    "get_colleague_availability",
    "extract_github_link_from_thread",
    "send_calendar_invite"
  ],
  "jill_pmreview": [
    "get_colleague_availability",
    "summarize_thread_for_handoff",
    "send_calendar_invite"
  ],
  "jill_status": [
    "list_active_threads",
    "summarize_thread_stage"
  ],
  "jill_handoff": [
    "post_recap",
    "remove_self_from_thread",
    "archive_thread"
  ]
} as const;

export const TOOL_DESCRIPTIONS = {
  "start_new_thread": "Opens a fresh email thread, addressed to the named candidate, with HM and jill-hm@diy.ai on Cc.",
  "compose_intro_email": "Writes a warm, professional intro using the template in this subagent's Knowledge Base.",
  "suggest_intro_slots": "Proposes 2-3 time slots for a 20-min intro call based on the HM's working hours.",
  "lookup_takehome_by_name": "Matches a take-home name the HM mentioned (e.g. \"backend\") against filenames in the Knowledge Base. Returns the closest HM-approved match.",
  "attach_file": "Attaches a file from the Knowledge Base to the outbound reply.",
  "send_reply_with_attachment": "Sends the drafted reply via AgentMail with the attachment, preserving thread headers.",
  "get_colleague_availability": "Asks the named colleague (Devon, Sam, Mira, etc.) for 3 available slots over the next 5 working days.",
  "extract_github_link_from_thread": "Pulls the candidate's GitHub link from earlier in the thread. Fails loudly if not present.",
  "summarize_thread_for_handoff": "Produces a 4-6 sentence recap of intro + take-home + code-review feedback for the incoming reviewer.",
  "send_calendar_invite": "Books the agreed slot and sends an .ics invite to all parties.",
  "list_active_threads": "Returns all candidate threads jill-diy is currently part of.",
  "summarize_thread_stage": "For one thread, infers the candidate's current stage strictly from what's already happened in the thread.",
  "post_recap": "Posts a brief recap of stages completed before exiting.",
  "remove_self_from_thread": "Removes jill-hm@diy.ai from the To/Cc on all future replies in this thread.",
  "archive_thread": "Marks the thread as archived in our cache. jill-diy stops responding; the HM continues normally."
} as const;

export const EDGES_OUT_BY_NODE = {
  "jill_orchestrator": [
    {
      "key": "jill_route_intro",
      "to": "Intro-Setter",
      "label": "Intro candidates"
    },
    {
      "key": "jill_route_takehome",
      "to": "TakeHome-Sender",
      "label": "Send take-home"
    },
    {
      "key": "jill_route_codereview",
      "to": "CodeReview-Scheduler",
      "label": "Schedule code review"
    },
    {
      "key": "jill_route_pmreview",
      "to": "PMReview-Scheduler",
      "label": "Schedule PM review"
    },
    {
      "key": "jill_route_status",
      "to": "Status-Reporter",
      "label": "Where are we with X?"
    },
    {
      "key": "jill_route_handoff",
      "to": "Handoff",
      "label": "HM takes over"
    }
  ]
} as const;

export const AGENTS = {
  "jill": {
    "label": "jill-diy",
    "topbar": "jill-diy — Hiring Pipeline Agent",
    "avatar": "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "defaultNode": "jill_orchestrator"
  },
  "jack": {
    "label": "jack-diy",
    "topbar": "Jack — Email Agent (Candidate)",
    "avatar": "linear-gradient(135deg, #fb923c, #ec4899)",
    "defaultNode": "orchestrator"
  }
} as const;
