# ThinkFirst

ThinkFirst is a privacy-first Chrome/Chromium extension for students using generative AI for learning. It adds a small learning layer around ChatGPT without replacing ChatGPT, judging answer correctness, or creating a critical-thinking score.

Core loop: Generate. Evaluate. Verify. Reflect.

## Final Documentation

See `FINAL_DOCUMENTATION.md` for the complete project handoff: product scope, installation, browser compatibility, QA/stress-test results, privacy model, known limitations, and roadmap.

## Extreme Manual Testing

Use `EXTREME_TEST_GUIDE.md` when you or student testers need a step-by-step test script: install/reload steps, exact prompts, how long to wait, expected ThinkFirst modals, dashboard checks, settings checks, privacy checks, and pass/fail criteria.

## What ThinkFirst Is

ThinkFirst helps students pause before relying on AI by adding skippable prompts for an initial attempt, comparison, source verification, and reflection. The MVP supports ChatGPT only.

The best-version concept is broader: ThinkFirst is the learning and judgment layer for generative AI. The AI provider supplies intelligence; ThinkFirst manages how the human engages with that intelligence.

## Why It Exists

AI should make knowledge more accessible, not make our own thinking optional. ThinkFirst is designed for university and secondary-school students who want to use AI while keeping their own reasoning active.

## Features

- Manifest V3 Chrome extension.
- First-run onboarding.
- Popup controls for mode selection and site pause.
- Five intention modes: Quick, Learn, Research, Create, School / Assignment.
- ChatGPT page detection.
- Mode-aware Attempt First intervention.
- Rich Compare/Evaluate intervention with disagreement, challenge, and confusion options.
- Claim -> Source -> Support -> Lateral check -> Judgment verification workflow.
- Beginner, intermediate, and advanced verification prompts.
- Mode-aware reflection and authorship prompts.
- Adaptive local friction levels: invisible, gentle, prompted, guided, checkpoint.
- Voluntary Commitment Mode.
- Local dashboard for observable AI-use habits, grouped by generation, evaluation, verification, reflection, and reliance patterns.
- Measurement tab explaining each metric's numerator, denominator, trigger, privacy boundary, and limitation.
- School / Assignment Mode with AI-use rule, assignment-stage, source-check, and authorship-process prompts.
- School copy blocker with a 10-minute Assignment Integrity Pause for risky AI-answer copying in School or Commitment Mode.
- Actionable local insights.
- Privacy panel with real storage counters.
- Privacy inspector event timeline.
- Delete all local behavior data.
- Export aggregate metadata.
- Optional local-only student pilot survey.
- GEVR framework and UNESCO roadmap tab.

## Privacy Model

**ThinkFirst does not persist or transmit prompts, AI responses, attempt text, reflection text, screenshots, or clipboard contents.**

ThinkFirst stores only local metadata such as whether an intervention was shown, completed, or skipped. It does not use external analytics, a telemetry backend, a database, authentication, or remote model inference.

In Quick Mode, ThinkFirst stays out of the way and collects no session metrics.

## Installation

Brave / Chrome / Chromium:

1. `npm install`
2. `npm run build`
3. Open `brave://extensions`, `chrome://extensions`, or your Chromium browser's extensions page
4. Enable Developer Mode
5. Load unpacked `/dist`

This prototype has no runtime package dependencies; `npm install` is optional unless your workflow expects it.

Other browser builds:

- `npm run build:edge` creates `dist-edge/`.
- `npm run build:firefox` creates experimental `dist-firefox/`.
- See `BROWSER_COMPATIBILITY.md` for exact browser notes.

## Architecture

- `manifest.json` defines a minimal MV3 extension with `storage` permission and ChatGPT host permissions.
- `src/background/serviceWorker.js` owns message handling, settings, local state, export, and deletion.
- `src/background/eventReducer.js` reduces metadata events into aggregate counters and session records.
- `src/content/index.js` implements the `ChatGPTAdapter` and all injected interventions.
- `src/popup` contains the compact extension popup.
- `src/onboarding` contains first-install setup.
- `src/dashboard` contains habits, trend, privacy, export/delete, and pilot survey views.
- `src/settings` contains privacy and intervention controls.
- `BROWSER_COMPATIBILITY.md` explains Brave, Chrome, Edge, Firefox, Opera, and Safari status.
- `tests` contains unit tests for reducer, metrics, and intervention policy.

## Data Model

Settings include mode, intervention toggles, intensity, history controls, onboarding state, and paused sites.

Aggregate statistics include:

- Attempt Rate
- Independent-start Frequency
- Compare Rate
- Challenge / Disagreement Rate
- Verification Activity
- Independent Cross-checking
- Source-link Inspection
- Reflection Rate
- Follow-up Exploration
- AI-answer Copy Events
- Quick Copy Rate
- Large Copy Rate
- Immediate Copy Rate
- First-response Stopping
- Passive Acceptance Proxy
- School Process Check Rate
- Intervention Skip Rate
- Low-engagement Episode Rate

These metrics reflect interaction behavior, not intelligence, learning quality, or cognitive ability.

## GEVR Framework

G - Generate: think before assistance.

E - Evaluate: compare AI output with your reasoning.

V - Verify: evaluate evidence and cross-check claims.

R - Reflect: retrieve and consolidate what you learned.

Human agency surrounds all four steps: the user decides why and how AI is being used.

## Research Grounding

ThinkFirst's best-version direction is informed by current AI literacy, media and information literacy, productive-friction, and learning-science work:

- UNESCO guidance emphasizes human-centred GenAI use, data privacy, and pedagogical design for education and research.
- UNESCO's MIL response to generative AI highlights user empowerment, source reliability, synthetic media literacy, and human agency.
- OECD/European Commission AI literacy work frames AI literacy as knowledge, skills, and attitudes for evaluating, using, and creating with AI responsibly.
- ETS AI literacy progression work emphasizes scaffolded tasks, inclusive design, formative assessment, and critical evaluation of AI outputs.
- Productive Failure and retrieval-preserving assistance support ThinkFirst's sequencing: students generate first, then compare, verify, and reflect.

The prototype records behavior indicators only. It does not claim to measure learning, intelligence, or cognitive ability.

## Current Limitations

- ChatGPT only.
- ChatGPT UI selectors may change.
- Behavioral metrics are not validated measures of learning.
- Prototype intervention thresholds are heuristic.
- Adaptive friction is local and deterministic; it is not machine learning.
- No cloud sync or institutional dashboard.
- No Gemini, Claude, Perplexity, accounts, or teacher dashboard.
- Firefox build is experimental until a manual Firefox click-through is completed.
- Safari requires a Safari Web Extension packaging pass.

## Roadmap

- Gemini adapter.
- Claude adapter.
- Perplexity adapter.
- Adaptive personalization.
- Multilingual UX.
- Education Mode with aggregate-only teacher-visible completion data.
- Research Mode exports for consented studies.
- ThinkFirst MIL Toolkit for schools, libraries, universities, and youth groups.
- Controlled study.

## Testing

Run:

```bash
npm test
npm run build
```

## Manual Browser Test Checklist

- Extension installs cleanly.
- Onboarding works.
- Popup opens.
- Mode switch works.
- School / Assignment Mode appears.
- ChatGPT page detected.
- Attempt First appears.
- Skip works.
- Completion works.
- AI response appears normally.
- Evaluate appears.
- Verify works.
- School Check works.
- Reflect works after the response is visible and the user interacts.
- Dashboard updates.
- Measurement tab explains event ratios and privacy boundaries.
- Reload browser and confirm data persists.
- Delete all data works.
- Quick Mode disables prompts.
- No external network calls from the extension.
- Chrome DevTools shows no prompt/response content in extension storage.
- Extension does not break normal ChatGPT use.

## Demo Scenario

Use this prompt in ChatGPT:

> Why can increasing interest rates reduce inflation?

Enable Learning Mode, complete Attempt First, compare the answer, run the Verify workflow, complete a reflection, then open the dashboard and privacy tab.

For School Mode, choose School / Assignment in the popup, complete Attempt First, use the School Check after the AI answer, inspect a source if one appears, then open the dashboard's Habits and Measurement tabs.
