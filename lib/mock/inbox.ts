import type { Folder, Thread } from "@/lib/types";

export const INBOX_THREADS: Thread[] = [
  {
    "id": "thr_list_01",
    "folder": "awaiting_hm",
    "stages": [
      "intro"
    ],
    "goal": "shortlist",
    "from": "jill-rohit@jackandjill.ai → you",
    "time": "11:20",
    "subject": "Shortlist: 8 candidates for Senior Designer role",
    "preview": "8 candidates ranked by JD match. Top picks: Tara, Liam, Yumi. Reply with the ones you want to intro.",
    "tags": [
      "shortlist"
    ],
    "userTags": [],
    "meta": {
      "msgs": 1,
      "status": "awaiting HM",
      "lastAction": "shortlist arrived"
    },
    "messages": [
      {
        "from": "jill-rohit@jackandjill.ai → you, jill-hm@diy.ai",
        "time": "11:20",
        "stage": "intro",
        "body": "Hi Rohit — shortlist for the Senior Designer role attached. 8 candidates, ranked by JD match.\n\nTop picks based on portfolio + JD fit:\n• Tara Chen — Stripe (4 yrs), Notion (2 yrs)\n• Liam O'Brien — Linear, ex-Figma\n• Yumi Sato — Airtable, indie practice\n\nReply with the ones you would like to intro and jill-diy will take it from there."
      }
    ]
  },
  {
    "id": "thr_single_01",
    "folder": "approval",
    "stages": [
      "intro"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Priya",
    "time": "14:22",
    "subject": "Intro: Priya Shah for Staff Backend",
    "preview": "jill-diy drafted a take-home reply for Priya — awaiting your approval.",
    "tags": [
      "Take-home Sender"
    ],
    "userTags": [
      "Acme priority"
    ],
    "meta": {
      "msgs": 5,
      "status": "awaiting approval",
      "lastAction": "Take-home Sender"
    },
    "stageScores": {
      "intro": {
        "score": 8.4,
        "reasoning": "Strong intro flow — Priya replied within hours and the HM followed up the same day. Tone was warm and professional. Docked slightly because no calendar invite was sent; scheduling stayed in free-text replies."
      }
    },
    "internalComments": [
      {
        "id": "ic_p01_1",
        "author": "Rohit",
        "initials": "R",
        "time": "3 days ago",
        "stage": "intro",
        "body": "Priya's Stripe background is exactly what we need for the payments team. Prioritize this intro."
      },
      {
        "id": "ic_p01_2",
        "author": "Devon",
        "initials": "D",
        "time": "14:15",
        "stage": "takehome",
        "body": "I'll review Priya's submission once it lands — ping me when she submits."
      }
    ],
    "messages": [
      {
        "from": "jill-rohit@jackandjill.ai → you, Priya Shah, jill-hm@diy.ai",
        "time": "4 days ago",
        "stage": "intro",
        "body": "Rohit, meet Priya Shah — backend engineer, 6 yrs, last at Stripe.\n\nPriya, meet Rohit, hiring manager at Zenlabs for the Staff Backend role.\n\nI will let you two take it from here. jill-diy is Cc'd and can help with scheduling, take-homes, and intros to colleagues."
      },
      {
        "from": "you",
        "time": "3 days ago",
        "stage": "intro",
        "body": "Thanks. Priya, how does next week look for a 20-min chat?"
      },
      {
        "from": "Priya Shah",
        "time": "3 days ago",
        "stage": "intro",
        "body": "Wed 11am IST works great. Looking forward."
      },
      {
        "from": "you",
        "time": "14:20",
        "stage": "takehome",
        "body": "jill — intro went well. Send Priya the backend take-home and have Devon code-review when she's done."
      },
      {
        "approval": true,
        "stage": "takehome",
        "sub": "Take-home Sender",
        "when": "drafted 12s ago",
        "to": [
          "Priya Shah <priya.shah@…>"
        ],
        "cc": [
          "you",
          "jill-hm@diy.ai"
        ],
        "bcc": [],
        "subjectLine": "Backend take-home for Zenlabs Staff role",
        "body": "Hi Priya,\n\nGreat chatting on the intro call. Attaching the backend take-home for the Staff role. It should take 4-6 hours of focused work; we suggest splitting across a couple of evenings.\n\n**Deadline:** Tue Mar 12, end of day IST (5 calendar days).\n**Submission:** reply to this thread with a public GitHub link.\n**Questions:** Rohit (HM) is reachable on WhatsApp at +91-98••• — feel free to ping for clarifications.\n\nGood luck — looking forward to seeing what you build.\n\n— jill-diy on behalf of Rohit",
        "attachment": {
          "name": "take-home-backend-v3.pdf",
          "size": "420 KB",
          "tag": "HM-approved"
        },
        "caption": "Drafted by Take-home Sender · checked by Guardian"
      }
    ]
  },
  {
    "id": "thr_single_02",
    "folder": "approval",
    "stages": [
      "codereview"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Marcus, Sam",
    "time": "13:45",
    "subject": "Intro: Marcus Lin for Frontend Eng",
    "preview": "jill-diy drafted a code review invite for Sam — awaiting your approval.",
    "tags": [
      "CodeReview Scheduler"
    ],
    "userTags": [],
    "meta": {
      "msgs": 6,
      "status": "awaiting approval",
      "lastAction": "CodeReview Scheduler"
    },
    "stageScores": {
      "intro": {
        "score": 8.5,
        "reasoning": "Clean intro — Marcus confirmed quickly and the HM moved to take-home within a day. Good pacing. Minor deduction: intro email didn't mention the role's design-system focus."
      },
      "takehome": {
        "score": 8.2,
        "reasoning": "Correct frontend take-home attached with clear deadline and submission instructions. Sam was named as reviewer when requested. Could improve by proactively suggesting a code-review window."
      }
    },
    "internalComments": [
      {
        "id": "ic_m02_1",
        "author": "Rohit",
        "initials": "R",
        "time": "5 days ago",
        "stage": "intro",
        "body": "Linear experience is a strong signal for our design-system work. Fast-track if take-home looks good."
      },
      {
        "id": "ic_m02_2",
        "author": "Sam Reyes",
        "initials": "S",
        "time": "Yesterday",
        "stage": "takehome",
        "body": "Repo is clean — good component structure and tests. Happy to do the walkthrough Thu 3pm if that works."
      },
      {
        "id": "ic_m02_3",
        "author": "Rohit",
        "initials": "R",
        "time": "13:35",
        "stage": "codereview",
        "body": "Let's lock Thu 3pm with Sam. Draft the invite and I'll approve."
      }
    ],
    "messages": [
      {
        "from": "jill-rohit@jackandjill.ai → you, Marcus Lin",
        "time": "6 days ago",
        "stage": "intro",
        "body": "Rohit, meet Marcus Lin — frontend engineer, ex-Linear. Marcus, meet Rohit, HM at Zenlabs."
      },
      {
        "from": "you",
        "time": "5 days ago",
        "stage": "intro",
        "body": "Marcus — Wed at 3pm IST for a quick intro?"
      },
      {
        "from": "Marcus Lin",
        "time": "5 days ago",
        "stage": "intro",
        "body": "Works. See you then."
      },
      {
        "from": "you",
        "time": "4 days ago",
        "stage": "takehome",
        "body": "jill — send Marcus the v2 frontend take-home."
      },
      {
        "from": "Marcus Lin",
        "time": "Yesterday",
        "stage": "takehome",
        "body": "Submitted: https://github.com/marcuslin/zenlabs-frontend-v2 — happy to walk through anything."
      },
      {
        "from": "you (added Sam to thread)",
        "time": "13:30",
        "stage": "codereview",
        "body": "jill — have Sam code-review Marcus's repo this week. Adding Sam (sam@zenlabs.ai) to the Cc."
      },
      {
        "approval": true,
        "stage": "codereview",
        "sub": "CodeReview Scheduler",
        "when": "drafted 8s ago",
        "to": [
          "Sam Reyes <sam@zenlabs.ai>"
        ],
        "cc": [
          "you",
          "Marcus Lin",
          "jill-hm@diy.ai"
        ],
        "bcc": [],
        "subjectLine": "Re: Intro: Marcus Lin for Frontend Eng",
        "body": "Hi Sam,\n\nRohit asked if you could code-review Marcus Lin's submission for the Frontend Eng role.\n\n**Repo:** https://github.com/marcuslin/zenlabs-frontend-v2\n**Suggested slots for a 30-min walkthrough with Marcus:**\n• Thu 11am IST\n• Thu 3pm IST\n• Fri 10am IST\n\nReply with the slot that works and 4-5 questions you would like to ask. I will send the invite.\n\n— jill-diy on behalf of Rohit",
        "caption": "Drafted by CodeReview Scheduler · checked by Guardian"
      }
    ]
  },
  {
    "id": "thr_single_03",
    "folder": "awaiting_hm",
    "stages": [
      "pmreview"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Elena, Devon, Mira",
    "time": "09:32",
    "subject": "Intro: Elena Rossi for Staff Backend",
    "preview": "PM Mira added to thread for the PM round. Awaiting Mira to confirm slot.",
    "tags": [
      "PMReview Scheduler"
    ],
    "userTags": [
      "Hot pick"
    ],
    "meta": {
      "msgs": 9,
      "status": "awaiting HM",
      "lastAction": "PMReview Scheduler"
    },
    "stageScores": {
      "intro": {
        "score": 8.8,
        "reasoning": "Excellent intro — Elena responded promptly and the HM advanced to take-home after a single exchange. Professional tone throughout."
      },
      "takehome": {
        "score": 8.6,
        "reasoning": "Backend take-home sent with HM-approved attachment, clear deadline, and WhatsApp contact for questions. Submission received on time."
      },
      "codereview": {
        "score": 9.2,
        "reasoning": "Devon looped in quickly, GitHub link extracted from thread, and Thu 3pm slot confirmed with calendar invite. Reviewer got a concise take-home summary."
      }
    },
    "messages": [
      {
        "from": "jill-rohit@jackandjill.ai → you, Elena Rossi",
        "time": "2 weeks ago",
        "stage": "intro",
        "body": "Rohit, meet Elena Rossi — staff backend engineer, ex-Datadog."
      },
      {
        "from": "you",
        "time": "2 weeks ago",
        "stage": "intro",
        "body": "Elena, intro chat next week?"
      },
      {
        "from": "Elena Rossi",
        "time": "12 days ago",
        "stage": "intro",
        "body": "Tue afternoon works."
      },
      {
        "from": "you",
        "time": "10 days ago",
        "stage": "takehome",
        "body": "jill — send the staff backend take-home."
      },
      {
        "from": "Elena Rossi",
        "time": "5 days ago",
        "stage": "takehome",
        "body": "Submitted: github.com/elenarossi/zen-backend"
      },
      {
        "from": "you (added Devon to thread)",
        "time": "4 days ago",
        "stage": "codereview",
        "body": "jill — Devon to code-review."
      },
      {
        "from": "Devon Singh",
        "time": "2 days ago",
        "stage": "codereview",
        "body": "Code review done. Strong design sense, clean code. Recommend moving forward."
      },
      {
        "from": "you (added Mira to thread)",
        "time": "09:30",
        "stage": "pmreview",
        "body": "jill — looping in Mira (PM) for the product round with Elena. Mira, this is Elena (staff backend cand) — Devon already code-reviewed and gave a thumbs up."
      },
      {
        "from": "jill-diy → all",
        "time": "09:32",
        "stage": "pmreview",
        "agent": true,
        "body": "Mira — sharing 3 slots for a 45-min PM round with Elena:\n• Wed 11am IST\n• Wed 3pm IST\n• Thu 10am IST\n\nRecap: Intro (Tue, 2 weeks ago, strong communication, deep on distributed systems) · Code review (Thu w/ Devon, clean architecture, recommended). Reply with your pick.",
        "caption": "Drafted by PMReview Scheduler · checked by Guardian · sent"
      }
    ]
  },
  {
    "id": "thr_aw_cand_01",
    "folder": "awaiting_candidate",
    "stages": [
      "intro"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Aiko",
    "time": "Yesterday",
    "subject": "Intro: Aiko Tanaka for Staff Backend",
    "preview": "jill-diy proposed 3 intro slots. Awaiting Aiko to confirm.",
    "tags": [
      "Intro Setter"
    ],
    "userTags": [],
    "meta": {
      "msgs": 4,
      "status": "awaiting candidate",
      "lastAction": "Intro Setter"
    },
    "messages": [
      {
        "from": "jill-rohit@jackandjill.ai → you, Aiko Tanaka",
        "time": "3 days ago",
        "stage": "intro",
        "body": "Rohit, meet Aiko Tanaka — staff backend, ex-LINE. Aiko, meet Rohit."
      },
      {
        "from": "you",
        "time": "2 days ago",
        "stage": "intro",
        "body": "jill — intro Aiko, propose times."
      },
      {
        "from": "jill-diy → Aiko, you",
        "time": "2 days ago",
        "stage": "intro",
        "agent": true,
        "body": "Hi Aiko — Rohit (HM at Zenlabs) would like a 20-min intro about the Staff Backend role. Three options: Tue 4pm JST, Wed 2pm JST, Thu 10am JST. Which works?",
        "caption": "Drafted by Intro Setter · checked by Guardian · sent"
      }
    ]
  },
  {
    "id": "thr_aw_cand_02",
    "folder": "awaiting_candidate",
    "stages": [
      "takehome"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Yumi",
    "time": "Mon 16:30",
    "subject": "Intro: Yumi Sato for Senior Designer",
    "preview": "Take-home sent 3 days ago, deadline Friday EOD. No reply yet.",
    "tags": [
      "Take-home Sender"
    ],
    "userTags": [],
    "meta": {
      "msgs": 4,
      "status": "awaiting candidate",
      "lastAction": "Take-home Sender"
    },
    "messages": [
      {
        "from": "jill-diy → Yumi, you",
        "time": "3 days ago",
        "stage": "takehome",
        "agent": true,
        "body": "Hi Yumi — attaching the frontend take-home for the Senior Designer role. Deadline Friday EOD. Questions to Rohit on WhatsApp.",
        "caption": "Drafted by Take-home Sender · checked by Guardian · sent"
      }
    ]
  },
  {
    "id": "thr_status_01",
    "folder": "all",
    "stages": [],
    "goal": "status",
    "from": "you only",
    "time": "10:15",
    "subject": "Status — anything blocked on me?",
    "preview": "You asked for a status check. jill-diy listed 6 threads awaiting your input.",
    "tags": [
      "Status Reporter"
    ],
    "userTags": [],
    "meta": {
      "msgs": 2,
      "status": "sent",
      "lastAction": "Status Reporter"
    },
    "messages": [
      {
        "from": "you → jill-hm@diy.ai",
        "time": "10:14",
        "stage": "intro",
        "body": "jill — quick status. What is blocked on me?"
      },
      {
        "from": "jill-diy → you",
        "time": "10:15",
        "stage": "intro",
        "agent": true,
        "body": "Hi Rohit — 6 threads need your input:\n\n• **Marcus Lin** (Frontend Eng) — submitted take-home, needs a code reviewer named\n• **Senior Designer shortlist** — 8 candidates from jackandjill.ai, awaiting your picks\n• **Aiko Tanaka** — proposed 3 intro slots, awaiting her reply (no nudge needed yet)\n• **Yumi Sato** — take-home sent Mon, deadline Fri, no reply yet\n• **Elena Rossi** — PM round, awaiting Mira to confirm slot\n• **Priya Shah** — take-home draft staged for your approval\n\nNothing else is blocked.",
        "caption": "Drafted by Status Reporter · checked by Guardian · sent"
      }
    ]
  },
  {
    "id": "thr_handoff_01",
    "folder": "handed_off",
    "stages": [
      "pmreview"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Devon",
    "time": "Yesterday",
    "subject": "Intro: Devon Park for Senior PM",
    "preview": "You said \"I will take it from here, thanks jill\". Recap posted, jill-diy removed from thread.",
    "tags": [
      "Handoff"
    ],
    "userTags": [],
    "meta": {
      "msgs": 8,
      "status": "handed off",
      "lastAction": "Handoff"
    },
    "messages": [
      {
        "from": "you",
        "time": "Yesterday",
        "stage": "pmreview",
        "body": "jill — I will take it from here, thanks. Going to chat with Devon directly."
      },
      {
        "from": "jill-diy → Devon, you",
        "time": "Yesterday",
        "stage": "pmreview",
        "agent": true,
        "body": "Quick recap before stepping out:\n\n• Intro call: Tue, went well per Rohit\n• Take-home: submitted, code-review with Mira completed Thu\n• PM round: completed Fri with Lakshmi — positive feedback\n\nDevon, Rohit will reach out directly from here. Best of luck!",
        "caption": "Drafted by Handoff · checked by Guardian · sent"
      }
    ]
  },
  {
    "id": "thr_arch_01",
    "folder": "archived",
    "stages": [
      "intro"
    ],
    "goal": "single-intro",
    "from": "jill-rohit@jackandjill.ai → you, Hiroshi",
    "time": "Last week",
    "subject": "Intro: Hiroshi Yamamoto for Staff Backend",
    "preview": "Candidate declined — not the right time. Archived.",
    "tags": [
      "Intro Setter"
    ],
    "userTags": [
      "Declined"
    ],
    "meta": {
      "msgs": 3,
      "status": "archived",
      "lastAction": "Intro Setter"
    },
    "messages": [
      {
        "from": "Hiroshi Yamamoto",
        "time": "1 week ago",
        "stage": "intro",
        "body": "Thanks for reaching out — really appreciate it, but not the right time for me to move. Best of luck with the search!"
      }
    ]
  }
];

export const FOLDERS: Folder[] = [
  {
    "key": "approval",
    "label": "Awaiting your approval",
    "count": 2,
    "badgeColor": "#ca8a04",
    "section": "main"
  },
  {
    "key": "all",
    "label": "All threads",
    "count": 10,
    "section": "main"
  },
  {
    "key": "awaiting_hm",
    "label": "Awaiting HM",
    "count": 3,
    "badge": true,
    "section": "main"
  },
  {
    "key": "awaiting_candidate",
    "label": "Awaiting candidate",
    "count": 2,
    "badge": true,
    "section": "main"
  },
  {
    "key": "handed_off",
    "label": "Handed off to HM",
    "count": 1,
    "section": "main"
  },
  {
    "key": "archived",
    "label": "Archived",
    "count": 1,
    "section": "main"
  },
  {
    "key": "stage_intro",
    "label": "Intro",
    "count": 4,
    "section": "stage",
    "stage": "intro"
  },
  {
    "key": "stage_takehome",
    "label": "Take-home",
    "count": 2,
    "section": "stage",
    "stage": "takehome"
  },
  {
    "key": "stage_codereview",
    "label": "Code review",
    "count": 1,
    "section": "stage",
    "stage": "codereview"
  },
  {
    "key": "stage_pmreview",
    "label": "PM review",
    "count": 2,
    "section": "stage",
    "stage": "pmreview"
  }
];
