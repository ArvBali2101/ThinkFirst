# ThinkFirst Research Grounding

ThinkFirst should never present its dashboard as a brain score, intelligence score, or diagnosis. The extension only sees local behavior metadata: whether a user attempted, evaluated, verified, reflected, copied quickly, followed up, skipped a prompt, or used a manual tool.

The research picture is mixed and real-world:

- Structured AI use can support learning when students compare, justify, verify, revise, and retrieve.
- Unstructured AI use can encourage cognitive offloading, superficial acceptance, and weaker metacognitive monitoring.
- The product goal is therefore not to block AI. It is to keep the user inside a Generate, Evaluate, Verify, Reflect loop when the task calls for learning or factual judgment.

## Metric Interpretation

| Metric | Real-world meaning | What it does not prove |
| --- | --- | --- |
| Attempt Rate | The user made a first move before AI assistance. | Mastery, correctness, or effort quality. |
| Independent-start Frequency | The session began with the user's goal or thinking. | That AI should be avoided. |
| Compare Rate | The user checked what changed between their thinking and AI's answer. | That either side was correct. |
| Challenge Rate | The user noticed disagreement, uncertainty, or a point to test. | That disagreement is always useful. |
| Verification Activity | The user used a claim-checking workflow when factual accuracy mattered. | That every AI answer needs full verification. |
| Independent Cross-checking | The user looked beyond a single answer or source trail. | Certainty or final truth. |
| Source-link Inspection | The user opened sources from an AI answer. | That the source was reliable, read, or supportive. |
| Reflection Rate | The user practiced explaining the idea without looking back. | Long-term retention by itself. |
| Follow-up Exploration | The user continued past the first answer. | That more messages always mean deeper learning. |
| AI-answer Copy Events | The user copied from an AI answer. | Where it was pasted, whether it was submitted, or whether it was revised. |
| Quick Copy Rate | The user copied soon after an AI answer appeared. | Careless use. |
| Large Copy Rate | A large portion of an AI answer was copied. | Plagiarism. |
| Immediate Copy Rate | The user copied a large AI answer quickly. | Cheating, laziness, or bad intent. |
| First-response Stopping | The session ended after the first answer. | That the task was low quality. |
| Passive Acceptance Proxy | A session ended with no visible checking or learning move after the AI answer. | Belief, use, or lack of learning. |
| School Process Check Rate | A School Mode session completed an assignment/process check. | Certified academic honesty or exact policy compliance. |
| Intervention Skip Rate | ThinkFirst's timing or friction may not fit the moment. | User failure. |

## How Metrics Are Measured

ThinkFirst uses local event ratios:

- **Attempt Rate** = `attempt_completed / attempt_prompt_shown`.
- **Independent-start Frequency** = `attempt_completed / non-Quick sessions`.
- **Compare Rate** = `evaluation_completed / evaluation_prompt_shown`.
- **Challenge Rate** = `(challengeEvents + disagreementEvents) / evaluation_completed`.
- **Verification Activity** = `verify_prompt_completed / verificationEligible`.
- **Independent Cross-checking** = `crossCheckCompleted / verificationEligible`.
- **Source-link Inspection** = `source_clicked / AI responses with visible source links`.
- **Reflection Rate** = `reflection_prompt_completed / reflection_prompt_shown`.
- **Follow-up Exploration** = `followup_message_detected / non-Quick sessions`.
- **AI-answer Copy Events** = `assistant_copy_detected / assistant_response_completed`.
- **Quick Copy Rate** = `copy events within 20 seconds / assistant copy events`.
- **Large Copy Rate** = `large assistant copy events / assistant copy events`.
- **Immediate Copy Rate** = `assistant_copy_detected session / non-Quick sessions`.
- **First-response Stopping** = `session_ended without follow-up / non-Quick sessions`.
- **Passive Acceptance Proxy** = `session ended after an AI answer with no follow-up, source click, evaluation, verification, reflection, or retrieval / non-Quick sessions`.
- **School Process Check Rate** = `school_integrity_check_completed / School Mode sessions`.
- **Intervention Skip Rate** = `interventionsSkipped / interventionsShown`.

These are behavior traces, not psychological measurements. They become meaningful only as patterns over time and alongside the user's task mode. For example, a high Immediate Copy Rate is not a problem by itself. It becomes worth noticing when paired with low evaluation, low verification, or low reflection in learning or research tasks.

ThinkFirst can detect a copy action from an AI answer, but it does not detect where the text is pasted. That is intentional. A privacy-first extension should not monitor documents, school portals, clipboard contents, or submission fields. Copy metrics are therefore uptake signals, not proof of use.

## Prompt Timing Model

ThinkFirst now follows a simple just-in-time adaptive intervention model:

| Decision point | Main prompt | Why it appears |
| --- | --- | --- |
| Before first submit | Attempt First | Generation before instruction can preserve agency and reveal prior knowledge. |
| After first AI answer in Learn/Create | Evaluate | The user can compare AI's answer against their own attempt while both are fresh. |
| After first AI answer in Research or sourced answers | Verify | Factual tasks need source/support checking more than generic reflection. |
| After first AI answer in School Mode | School Check | The user documents allowed use, assignment stage, and what must remain their own work. |
| After several exchanges | Retrieve/checkpoint | Enough material exists to consolidate, test, challenge, or verify. |
| Anytime by user choice | Side-panel tools | Manual prompts respect autonomy and reduce unnecessary interruption. |

The policy also includes burden rules:

- default automatic prompt budget is 3 per session;
- Research and Commitment Mode may receive stronger structure;
- School Mode adds process checks for assignments and exam preparation;
- two skips in one session shut off automatic prompts;
- cooldowns still apply after the first post-answer nudge;
- manual tools remain available because user-initiated support is less intrusive.

This follows JITAI principles: prompts should be tied to decision points, tailoring variables, intervention options, decision rules, receptivity, and burden. In plain English: ThinkFirst should ask at the moment when a learning move is useful, and back off when the user is not receptive.

## Sources Used

- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. Psychological Science. https://pubmed.ncbi.nlm.nih.gov/16507066/
- Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989). Self-explanations. Cognitive Science. https://doi.org/10.1207/s15516709cog1302_1
- Kapur, M. (2008). Productive Failure. Cognition and Instruction. https://www.tandfonline.com/doi/abs/10.1080/07370000802212669
- McGrew, S., Breakstone, J., Ortega, T., Smith, M., & Wineburg, S. (2020). Learning to evaluate. Computers & Education. https://www.sciencedirect.com/science/article/abs/pii/S0360131519302647
- Lee, H. P., Sarkar, A., Tankelevitch, L., Drosos, I., Rintel, S., Banks, R., & Wilson, N. (2025). The Impact of Generative AI on Critical Thinking. CHI. https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/
- Deng, R., Jiang, M., Yu, X., Lu, Y., & Liu, S. (2025). Does ChatGPT enhance student learning? Computers & Education. https://www.sciencedirect.com/science/article/pii/S0360131524002380
- Alubthane, F. O. (2026). Amplifier or substitute? Frontiers in Psychology. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1863931/full
- Nahum-Shani, I., et al. (2018). Just-in-Time Adaptive Interventions in Mobile Health. Annals of Behavioral Medicine. https://pmc.ncbi.nlm.nih.gov/articles/PMC5364076/
- Guo, L. (2022). Using Metacognitive Prompts to Enhance Self-Regulated Learning and Learning Outcomes. Journal of Computer Assisted Learning. https://eric.ed.gov/?id=EJ1333210
- Thomann, H., & Deutscher, V. (2025). Scaffolding through prompts in digital learning. Educational Research Review. https://www.sciencedirect.com/science/article/pii/S1747938X25000235
- Velasco Gomez, S., Santiago Rebolledo, E. K., & Meza Cano, J. M. (2025). Evidence verification and information sources in academic assignments elaborated with generative Artificial Intelligence. https://revistas.usp.br/ep/en/article/view/245301
- Ogunyemi, D., et al. (2024). Beyond boundaries: exploring a generative artificial intelligence assignment in graduate, online science courses. https://pmc.ncbi.nlm.nih.gov/articles/PMC11636326/
- Zou, D., et al. (2025). A systematic literature review of generative artificial intelligence literacy in schools. https://www.sciencedirect.com/science/article/pii/S2666920X25001274
