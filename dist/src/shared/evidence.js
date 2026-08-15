export const METRIC_KEYS = [
  "attemptRate",
  "independentStartFrequency",
  "compareRate",
  "challengeRate",
  "verificationActivity",
  "independentCrossCheckRate",
  "sourceInspectionRate",
  "reflectionRate",
  "followupExploration",
  "assistantCopyEventRate",
  "quickCopyRate",
  "largeCopyRate",
  "immediateCopyRate",
  "firstResponseStoppingRate",
  "passiveAcceptanceRate",
  "schoolProcessCheckRate",
  "interventionSkipRate"
];

export const EVIDENCE_LENSES = {
  attemptRate: {
    mechanism: "Productive generation",
    realWorldSignal: "You made your own first move before AI filled the gap. In real learning, that first move can expose what you know, what you assume, and where instruction should land.",
    doesNotMean: "A high number does not prove mastery. A rushed or copied attempt is weaker than a small honest prediction.",
    nextAction: "For one important answer, write a prediction, first step, or outline before reading the AI answer.",
    evidenceTag: "Productive failure and generation before instruction"
  },
  independentStartFrequency: {
    mechanism: "Learning agency",
    realWorldSignal: "Your session began with your own goal and attempt instead of immediately outsourcing the task. This is a proxy for keeping ownership of the problem.",
    doesNotMean: "It does not mean you should avoid AI. It only shows whether AI entered after you had formed an initial position.",
    nextAction: "Start the next learning session with: What am I trying to learn, and what do I already think?",
    evidenceTag: "Self-regulated learning and productive failure"
  },
  compareRate: {
    mechanism: "Metacognitive monitoring",
    realWorldSignal: "You compared AI output with your own reasoning. This supports calibration: noticing what AI confirmed, corrected, added, or made unclear.",
    doesNotMean: "It does not prove the AI was right or that your comparison was accurate.",
    nextAction: "After the next useful AI answer, choose one: confirmed, corrected, added, different approach, disagreement, or confusion.",
    evidenceTag: "Self-explanation and monitoring understanding"
  },
  challengeRate: {
    mechanism: "Evaluative judgment",
    realWorldSignal: "You marked disagreement or challenged part of the answer. In real work, this is the move from accepting output to testing it.",
    doesNotMean: "More challenge is not always better. Some answers are straightforward, and disagreement without follow-up can become noise.",
    nextAction: "When something feels off, ask the AI for assumptions, counterexamples, or a source before accepting it.",
    evidenceTag: "Critical thinking as verification, integration, and task stewardship"
  },
  verificationActivity: {
    mechanism: "Epistemic vigilance",
    realWorldSignal: "You used a claim-checking workflow when factual accuracy mattered. This is closer to media and information literacy than simply clicking a citation.",
    doesNotMean: "It does not mean every answer needs verification. Creative brainstorming and simple drafting often need lighter friction.",
    nextAction: "Pick one important claim, identify who produced the evidence, and judge Supported, Contradicted, or Uncertain.",
    evidenceTag: "Civic online reasoning and lateral evaluation"
  },
  independentCrossCheckRate: {
    mechanism: "Lateral reading",
    realWorldSignal: "You checked an independent source instead of staying inside one answer or one citation trail. That helps catch weak, circular, or misleading support.",
    doesNotMean: "It does not guarantee truth. Independent sources can still be wrong or repeat the same original mistake.",
    nextAction: "For a claim that affects a decision, compare what two independent sources say and note any disagreement.",
    evidenceTag: "Fact-checking strategies used by expert evaluators"
  },
  sourceInspectionRate: {
    mechanism: "Source inspection",
    realWorldSignal: "You opened external sources that appeared inside AI answers. In school and research work, this is the move from receiving a claim to inspecting where it came from.",
    doesNotMean: "Opening a source does not prove the source was reliable, read carefully, or supportive of the claim.",
    nextAction: "When a source opens, ask: Who made this, what evidence is shown, and does it actually support the AI's claim?",
    evidenceTag: "Evidence verification and source evaluation"
  },
  reflectionRate: {
    mechanism: "Retrieval practice",
    realWorldSignal: "You tried to explain the idea without looking back. Retrieval is a real learning event, not just a report of how learning felt.",
    doesNotMean: "It does not measure intelligence or final retention. It only shows you practiced bringing the idea back from memory.",
    nextAction: "Close or hide the answer and explain the key idea in your own words in 60 seconds.",
    evidenceTag: "Test-enhanced learning and self-explanation"
  },
  followupExploration: {
    mechanism: "Active inquiry",
    realWorldSignal: "You continued after the first answer by asking for clarification, examples, alternatives, or tests. This can turn AI from an answer machine into a thinking partner.",
    doesNotMean: "More follow-ups are not automatically better. The question is whether the follow-up improves understanding or evidence.",
    nextAction: "Ask one follow-up that makes the answer more testable: example, counterexample, assumption, source, or simpler explanation.",
    evidenceTag: "Structured GenAI use versus passive use"
  },
  assistantCopyEventRate: {
    mechanism: "AI text uptake",
    realWorldSignal: "You copied from an AI answer. This can be normal, but it is one of the clearest observable moments where AI output may move into your work.",
    doesNotMean: "It does not show where the text was pasted, whether it was submitted, or whether it was appropriately transformed.",
    nextAction: "Before using copied AI text in schoolwork, mark what you changed, checked, or rewrote in your own words.",
    evidenceTag: "Academic integrity and cognitive offloading"
  },
  quickCopyRate: {
    mechanism: "Speed-accuracy tradeoff",
    realWorldSignal: "You copied soon after the answer appeared. Fast uptake can be efficient, but it leaves less time for evaluation, verification, or revision.",
    doesNotMean: "It does not prove careless use. Some short answers and code snippets are meant to be copied quickly.",
    nextAction: "For assignments or factual claims, add one 20-second pause: What part must I verify or rewrite before I use this?",
    evidenceTag: "Verification behavior under time pressure"
  },
  largeCopyRate: {
    mechanism: "Large-output transfer",
    realWorldSignal: "A large portion of an AI answer was copied. In school contexts, large transfers deserve an authorship, source, and policy check.",
    doesNotMean: "It does not prove plagiarism. Large copying may be notes, code, a quote for analysis, or material that will be revised.",
    nextAction: "Use School Check: What did AI contribute, what did I contribute, and is this allowed for the task?",
    evidenceTag: "Process documentation and academic integrity"
  },
  immediateCopyRate: {
    mechanism: "Possible cognitive offloading",
    realWorldSignal: "You often copied a large part of an AI answer soon after it appeared. That can be efficient, but paired with low evaluation or retrieval it may signal passive reliance.",
    doesNotMean: "It does not imply cheating, laziness, or bad intent. Copying can be normal for code, notes, or drafts.",
    nextAction: "Before copying a high-stakes answer, do one Evaluate or Verify step so the copied text remains under your judgment.",
    evidenceTag: "Cognitive offloading and over-reliance risk"
  },
  firstResponseStoppingRate: {
    mechanism: "First-answer reliance",
    realWorldSignal: "Sessions often ended after the first AI answer. In real tasks, that can mean speed, but it can also mean missed assumptions, missing evidence, or shallow understanding.",
    doesNotMean: "It does not mean every short session is weak. Quick mode exists because some tasks really are simple.",
    nextAction: "For learning or research tasks, add one follow-up: What is the strongest caveat, source, or alternative approach?",
    evidenceTag: "Unstructured GenAI use and superficial engagement"
  },
  passiveAcceptanceRate: {
    mechanism: "Uninspected acceptance",
    realWorldSignal: "A session ended after an AI response without a visible follow-up, source click, evaluation, verification, or reflection. This is the closest privacy-preserving proxy for just accepting the answer.",
    doesNotMean: "It does not prove the user believed the answer, used it, or learned nothing. Some simple tasks need no extra work.",
    nextAction: "For school, research, or high-stakes decisions, pair the first answer with one visible check: Evaluate, Verify, or Reflect.",
    evidenceTag: "Passive reliance and acceptance risk"
  },
  schoolProcessCheckRate: {
    mechanism: "Academic process documentation",
    realWorldSignal: "In School Mode, you completed an AI-use process check. This helps separate allowed support, source verification, and your own contribution.",
    doesNotMean: "It does not certify academic honesty or compliance with a specific teacher's policy.",
    nextAction: "Before submitting, confirm: allowed use, AI contribution, my contribution, source checks, and final rewrite.",
    evidenceTag: "AI literacy and academic integrity"
  },
  interventionSkipRate: {
    mechanism: "Friction fit",
    realWorldSignal: "You skipped ThinkFirst prompts. This is mainly product feedback: the timing, frequency, or mode may not match what you were trying to do.",
    doesNotMean: "It is not a failure score. Skipping can be the right choice when you need speed or the prompt is badly timed.",
    nextAction: "Use Light frequency for normal work and Commitment Mode only when you voluntarily want stronger learning structure.",
    evidenceTag: "Adaptive productive friction and user-controlled scaffolding"
  }
};

export const RESEARCH_SOURCES = [
  {
    name: "Roediger & Karpicke (2006), test-enhanced learning",
    url: "https://pubmed.ncbi.nlm.nih.gov/16507066/",
    use: "Retrieval practice can improve delayed retention more than restudy, so Reflect is treated as a learning action."
  },
  {
    name: "Chi et al. (1989), self-explanations",
    url: "https://doi.org/10.1207/s15516709cog1302_1",
    use: "Stronger learners generate explanations and monitor confusion, so Evaluate asks what changed and what remains unclear."
  },
  {
    name: "Kapur (2008), productive failure",
    url: "https://www.tandfonline.com/doi/abs/10.1080/07370000802212669",
    use: "Attempt First is based on meaningful generation before instruction, not arbitrary waiting."
  },
  {
    name: "McGrew et al. (2020), learning to evaluate online information",
    url: "https://www.sciencedirect.com/science/article/abs/pii/S0360131519302647",
    use: "Verification emphasizes source quality, support, and lateral checking rather than citation-clicking."
  },
  {
    name: "Lee et al. (2025), generative AI and critical thinking at work",
    url: "https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/",
    use: "Critical thinking with AI shifts toward verification, integration, and task stewardship; confidence in AI can reduce critical effort."
  },
  {
    name: "Deng et al. (2025), experimental ChatGPT learning review",
    url: "https://www.sciencedirect.com/science/article/pii/S0360131524002380",
    use: "ChatGPT can improve learning outcomes in structured interventions, but the authors call for objective and long-term measures."
  },
  {
    name: "Alubthane (2026), systematic review of GenAI and higher-order cognition",
    url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1863931/full",
    use: "GenAI appears more helpful under structured pedagogy and riskier under unguided use, especially over-reliance and cognitive offloading."
  },
  {
    name: "Nahum-Shani et al. (2018), JITAI design principles",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5364076/",
    use: "Prompt timing should be based on decision points, tailoring variables, intervention options, decision rules, receptivity, and burden."
  },
  {
    name: "Guo (2022), metacognitive prompts meta-analysis",
    url: "https://eric.ed.gov/?id=EJ1333210",
    use: "Metacognitive prompts improve self-regulated learning and outcomes, especially when specific, adaptive, and paired with feedback."
  },
  {
    name: "Thomann & Deutscher (2025), digital prompt meta-analysis",
    url: "https://www.sciencedirect.com/science/article/pii/S1747938X25000235",
    use: "Prompts are more effective when action-based, concise, tailored to learner behavior, and not treated as one-size-fits-all."
  },
  {
    name: "Velasco Gomez et al. (2025), evidence verification in AI-supported assignments",
    url: "https://revistas.usp.br/ep/en/article/view/245301",
    use: "Guided verification of evidence and sources is important for academic assignments involving generative AI."
  },
  {
    name: "Ogunyemi et al. (2024), AI assignment with peer-reviewed source evaluation",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11636326/",
    use: "AI assignments can be designed around evaluating AI-generated content against peer-reviewed evidence and documenting ethical use."
  },
  {
    name: "Zou et al. (2025), GenAI literacy in schools review",
    url: "https://www.sciencedirect.com/science/article/pii/S2666920X25001274",
    use: "Students need explicit scaffolds for evaluating AI outputs, using sources, and incorporating AI ethically."
  },
  {
    name: "Cognitive offloading in student-AI collaboration (2026)",
    url: "https://www.sciencedirect.com/science/article/pii/S2451958826002046",
    use: "Patterns of minimal modification and low-context prompting can indicate offloading risk, supporting copy and passive-acceptance metrics."
  }
];

export const MEASUREMENT_MODEL = {
  attemptRate: {
    numerator: "attempt_completed",
    denominator: "attempt_prompt_shown",
    whenMeasured: "When ThinkFirst offers Attempt First and the user continues with Done instead of Skip.",
    eventTrigger: "Pre-submit decision point on the first user message in Learn, Research, or Create mode.",
    privacyBoundary: "The typed attempt is not stored. Only readiness and unfamiliarity categories may be stored.",
    limitation: "It cannot judge attempt quality, correctness, or whether the user thought deeply."
  },
  independentStartFrequency: {
    numerator: "attempt_completed",
    denominator: "session_started",
    whenMeasured: "Across non-Quick sessions, how many sessions include a completed first attempt.",
    eventTrigger: "Session begins when the user submits or opens the ThinkFirst panel in an active mode.",
    privacyBoundary: "No prompt text or conversation title is stored.",
    limitation: "A session can begin from panel use, so this is a behavioral signal rather than a perfect task boundary."
  },
  compareRate: {
    numerator: "evaluation_completed",
    denominator: "evaluation_prompt_shown",
    whenMeasured: "When the user completes the Compare/Evaluate card after an AI response.",
    eventTrigger: "Manual Compare tool or an automatic post-response Evaluate nudge.",
    privacyBoundary: "The typed note is not stored. Only the selected evaluation category is stored.",
    limitation: "It records that comparison happened, not whether the comparison was accurate."
  },
  challengeRate: {
    numerator: "challengeEvents + disagreementEvents",
    denominator: "evaluation_completed",
    whenMeasured: "When the selected evaluation category is disagreement or challenge.",
    eventTrigger: "Evaluation card completion or Challenge AI tool completion.",
    privacyBoundary: "Challenge text is not stored.",
    limitation: "More challenge is not always better; useful challenge should lead to testing or revision."
  },
  verificationActivity: {
    numerator: "verify_prompt_completed",
    denominator: "verificationEligible",
    whenMeasured: "When a user finishes Claim -> Source -> Cross-check after ThinkFirst marks verification relevant.",
    eventTrigger: "Research mode, AI answer with visible links, or manual Verify tool.",
    privacyBoundary: "Source URLs, page content, and claim text are not stored.",
    limitation: "It cannot confirm the source was actually read or whether the user's judgment was correct."
  },
  independentCrossCheckRate: {
    numerator: "crossCheckCompleted",
    denominator: "verificationEligible",
    whenMeasured: "When the user marks that an independent cross-check was completed.",
    eventTrigger: "Final step of the verification workflow.",
    privacyBoundary: "No independent source URL or claim text is stored.",
    limitation: "Self-reported completion can overstate or understate actual source evaluation."
  },
  sourceInspectionRate: {
    numerator: "source_clicked",
    denominator: "assistant_response_completed with sourcePresent",
    whenMeasured: "When the user opens an external link contained in the latest assistant answer.",
    eventTrigger: "Click event on an HTTP link inside an assistant message.",
    privacyBoundary: "The link URL is not stored. Only the click event is stored.",
    limitation: "It cannot know whether the source was read, trusted, or relevant."
  },
  reflectionRate: {
    numerator: "reflection_prompt_completed",
    denominator: "reflection_prompt_shown",
    whenMeasured: "When the user completes a no-looking-back reflection or Finish Learning retrieval.",
    eventTrigger: "Manual Explain/Finish Learning tool or a later-session retrieval checkpoint.",
    privacyBoundary: "Reflection text is not stored.",
    limitation: "It shows retrieval practice happened; it does not measure delayed retention."
  },
  followupExploration: {
    numerator: "followup_message_detected",
    denominator: "session_started",
    whenMeasured: "When another user message appears after at least one completed AI response in the same session.",
    eventTrigger: "Submit after assistant_response_completed.",
    privacyBoundary: "Follow-up text is not stored.",
    limitation: "It cannot distinguish a deep follow-up from a short clarification or unrelated message."
  },
  assistantCopyEventRate: {
    numerator: "assistant_copy_detected",
    denominator: "assistant_response_completed",
    whenMeasured: "When selected text from the latest assistant answer is copied.",
    eventTrigger: "Browser copy event whose selection is inside an assistant message.",
    privacyBoundary: "Clipboard contents and copied text are not read or stored.",
    limitation: "It cannot know where the text was pasted or how much it was revised."
  },
  quickCopyRate: {
    numerator: "assistant_copy_detected within 20 seconds",
    denominator: "assistant_copy_detected",
    whenMeasured: "When a copy from an assistant message happens soon after the answer stabilizes.",
    eventTrigger: "Copy event with secondsAfterResponse <= 20.",
    privacyBoundary: "Only timing and size class are stored.",
    limitation: "Fast copying can be appropriate for simple or low-risk tasks."
  },
  largeCopyRate: {
    numerator: "assistant_copy_detected with copiedRangeClass = large",
    denominator: "assistant_copy_detected",
    whenMeasured: "When a copied assistant selection is classified as large by local character length.",
    eventTrigger: "Copy event from assistant text longer than the local large-copy threshold.",
    privacyBoundary: "The copied content itself is not stored.",
    limitation: "Large copying may be legitimate note-taking or draft transfer."
  },
  immediateCopyRate: {
    numerator: "assistant_copy_detected within the current session",
    denominator: "session_started",
    whenMeasured: "When browser copy happens from the latest assistant message after the answer stabilized.",
    eventTrigger: "Copy event from an assistant message selection.",
    privacyBoundary: "Clipboard content is not read or stored. Only copied size class and seconds-after-response are stored.",
    limitation: "Copying may be appropriate for code, citations, notes, or drafts."
  },
  firstResponseStoppingRate: {
    numerator: "session_ended without followup_message_detected",
    denominator: "session_started",
    whenMeasured: "When a session ends and no follow-up was detected after the AI response.",
    eventTrigger: "New conversation, manual reset, navigation change, or Finish Learning completion.",
    privacyBoundary: "No conversation content is stored.",
    limitation: "Some tasks genuinely need one answer, especially in Quick-like use."
  },
  passiveAcceptanceRate: {
    numerator: "passiveAcceptanceEpisodes",
    denominator: "session_started",
    whenMeasured: "When a session ends after an assistant answer with no follow-up, evaluation, verification, reflection, retrieval, or source click.",
    eventTrigger: "session_ended after an assistant response with no visible checking or learning action.",
    privacyBoundary: "No conversation content or source URLs are stored.",
    limitation: "It is a proxy for acceptance, not proof that the user believed or used the answer."
  },
  schoolProcessCheckRate: {
    numerator: "school_integrity_check_completed",
    denominator: "schoolSessions",
    whenMeasured: "When School Mode users complete the process/integrity check.",
    eventTrigger: "School Check modal completion.",
    privacyBoundary: "Only categories such as assignment stage and AI-use rule are stored.",
    limitation: "It cannot certify compliance with a teacher's exact policy."
  },
  interventionSkipRate: {
    numerator: "interventionsSkipped",
    denominator: "interventionsShown",
    whenMeasured: "Whenever a ThinkFirst card is shown and the user chooses Skip or Not now.",
    eventTrigger: "Any automatic or manual ThinkFirst prompt with a skip path.",
    privacyBoundary: "Skip reason text is not collected.",
    limitation: "High skip rate can mean bad timing or too much friction, not low motivation."
  }
};

export const PROMPTING_MODEL = [
  {
    decisionPoint: "Before first submit",
    trigger: "The user is in Learn, Research, or Create mode and sends the first message of a session.",
    intervention: "Attempt First",
    reason: "Generation before instruction can reveal prior knowledge and preserve ownership.",
    burdenRule: "Shown at most once per session unless Commitment Mode is enabled."
  },
  {
    decisionPoint: "After first AI answer",
    trigger: "The answer has stabilized and the session has not already used a post-response nudge.",
    intervention: "Evaluate in Learn/Create, Verify in Research or when sources are visible.",
    reason: "The teachable moment is immediately after the AI changes the user's thinking.",
    burdenRule: "Counts against the automatic prompt budget and shuts off after repeated skips."
  },
  {
    decisionPoint: "After later exchanges",
    trigger: "The session has at least three exchanges or shows reliance cues such as quick copying.",
    intervention: "Retrieve, Test me, Verify, or Challenge checkpoint.",
    reason: "Retrieval and evaluation are most useful after enough material exists to consolidate.",
    burdenRule: "Default behavior keeps this as the second or third automatic prompt, not a constant interruption."
  },
  {
    decisionPoint: "Manual side-panel use",
    trigger: "The user opens a ThinkFirst tool.",
    intervention: "Compare, Verify, Challenge, Uncertainty, Explain, or Finish Learning.",
    reason: "User-initiated prompts respect autonomy and reduce unnecessary interruption.",
    burdenRule: "Manual tools are always available in active modes and do not require conversation text."
  }
];
