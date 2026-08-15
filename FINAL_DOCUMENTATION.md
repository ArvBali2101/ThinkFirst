# ThinkFirst Final Documentation

Status: UNESCO submission-ready prototype documentation  
Date: August 15, 2026  
Workspace: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco`

## 1. Project Summary

ThinkFirst is a privacy-first browser extension that adds a learning and judgment layer around generative AI. It does not replace ChatGPT, grade the user, or block AI use by default.

Its purpose is to help the user keep four human responsibilities active while using AI:

```text
Generate -> Evaluate -> Verify -> Reflect
```

The AI provider gives the answer. ThinkFirst shapes how the human engages with that answer.

Current implementation: Chrome/Chromium Manifest V3 extension with a ChatGPT adapter, local-only behavior metrics, learning prompts, verification workflow, reflection prompts, School / Assignment Mode, dashboard, privacy inspector, and browser build targets for Chromium, Edge, and experimental Firefox.

## 2. What Is Implemented Now

### Core Extension

- Manifest V3 extension.
- Works as an unpacked extension in Brave, Chrome-compatible Chromium browsers, and Edge.
- Experimental Firefox build is generated.
- Minimal permission model: only `storage`.
- ChatGPT page adapter and injected ThinkFirst interface.
- Popup for mode selection and site pause.
- Onboarding, settings, dashboard, and privacy screens.

### User Modes

- Quick: minimal interruption, no session metrics.
- Learn: full Generate, Evaluate, Verify, Reflect learning loop.
- Research: stronger verification emphasis.
- Create: focuses on authorship, originality, and evaluation.
- School / Assignment: supports assignment-stage and process-check prompts.

### Learning Interventions

- Attempt First: asks the user to think before AI assistance.
- Evaluate / Compare: asks what changed after the AI answer.
- Challenge prompts: encourages disagreement, confusion checks, and follow-up questions.
- Verify workflow: Claim -> Source -> Support -> Lateral check -> Judgment.
- Reflection / retrieval: asks the user to explain the key idea without depending on the AI answer.
- School Check: asks whether AI use fits the assignment process.
- Adaptive productive friction: local, deterministic prompting based on behavior patterns.
- Commitment Mode: voluntary stronger friction chosen by the user.

### Dashboard And Metrics

ThinkFirst reports behavior patterns, not intelligence or learning ability. Metrics are grouped into:

- Generation: attempt rate and independent-start behavior.
- Evaluation: compare rate, challenge/disagreement rate, follow-up exploration.
- Verification: verification completion, source inspection, lateral checking, support judgment.
- Reflection: retrieval and reflection completion.
- Reliance patterns: quick copy, large copy, immediate copy, first-response stopping, passive acceptance proxy.
- School process: assignment process checks and source/authorship prompts.
- Friction health: skipped interventions and low-engagement episodes.

The dashboard includes a Measurement tab that explains each metric's numerator, denominator, trigger, privacy boundary, and limitation.

## 3. Privacy Model

ThinkFirst is designed to be technically auditable.

It does not store or transmit:

- User prompts.
- AI responses.
- Attempt text.
- Reflection text.
- Clipboard contents.
- Screenshots.
- Source URLs.
- Page HTML.
- Browser history.

It stores local behavior metadata only, such as:

- `attempt_completed`
- `intervention_skipped`
- `verification_completed`
- `reflection_completed`
- `copy_event`
- `school_check_completed`

The extension has no telemetry backend, no external analytics, no database, no authentication, and no remote model inference.

The Privacy Inspector shows local storage counters and a content-free event timeline. Delete-all now clears both the main extension state and the local pilot survey key `tf_pilot_survey_local`.

## 4. How To Build And Run

Open PowerShell in:

```powershell
C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco
```

Install and build:

```powershell
npm.cmd install
npm.cmd run build
```

The Chromium extension build is created at:

```text
C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist
```

### Brave

1. Open Brave.
2. Type `brave://extensions` in the browser address bar.
3. Turn on Developer Mode.
4. Click Load unpacked.
5. Select `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist`.

Do not type `brave://extensions` or `chrome://extensions` into PowerShell. Those are browser pages, not terminal commands.

### Chrome

1. Open Chrome.
2. Type `chrome://extensions` in the browser address bar.
3. Turn on Developer Mode.
4. Click Load unpacked.
5. Select `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist`.

### Edge

Build the Edge-labelled package:

```powershell
npm.cmd run build:edge
```

Load unpacked from:

```text
C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist-edge
```

### Firefox Experimental

Build:

```powershell
npm.cmd run build:firefox
```

Then open:

```text
about:debugging#/runtime/this-firefox
```

Choose Load Temporary Add-on and select:

```text
C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist-firefox\manifest.json
```

## 5. Basic Manual Check

After loading the extension:

1. Open `https://chatgpt.com/`.
2. Confirm the ThinkFirst pill appears once.
3. Open the pill or extension popup.
4. Switch to Learn Mode.
5. Send a ChatGPT prompt.
6. Confirm Attempt First appears.
7. Complete or skip the prompt.
8. Wait for the AI response.
9. Confirm Evaluate / Verify / Reflect options appear after the response.
10. Open the dashboard and confirm habits update.
11. Open the privacy panel and confirm no prompt or response content is stored.

Useful demo prompt:

```text
Why can increasing interest rates reduce inflation?
```

## 6. Automated Testing

### Unit And Build Tests

From the project root:

```powershell
npm.cmd test
npm.cmd run build
```

Latest local unit/build history:

```text
npm.cmd test -> passed
npm.cmd run build -> built dist/
```

The later deep stress report recorded:

```text
npm.cmd test -> 30/30 passed
node --check -> clean
npm.cmd run build:all -> built dist/, dist-edge/, dist-firefox/
dist contract -> passed
live Brave check -> passed
deep Brave/Edge smoke -> passed
```

### QA Harness

QA harness path:

```text
C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\qa-starter\chrome-extension-ai-qa-starter
```

The built extension was copied into the harness `extension/` folder for testing.

Run:

```powershell
cd "C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\qa-starter\chrome-extension-ai-qa-starter"
npm.cmd install
npm.cmd run install:browsers
```

Create a dedicated headed ChatGPT test profile:

```powershell
$env:HEADED="1"
npm.cmd run qa:login
```

This requires manual ChatGPT login in the opened browser. It cannot be completed automatically from the terminal.

Run the test suites:

```powershell
npm.cmd run qa:smoke
npm.cmd run qa:matrix
npm.cmd run qa:summarize
```

For a live matrix against real ChatGPT pages:

```powershell
$env:QA_LIVE_MATRIX="1"
npm.cmd run qa:matrix
```

The live matrix is slower and can be affected by ChatGPT UI changes, login state, rate limits, and network behavior. The default matrix uses deterministic synthetic ChatGPT-origin pages so extension behavior can be tested reliably at scale.

## 7. Final QA Result

Final generated QA summary:

```text
Total results: 2000
PASS: 2000
FAIL: 0
SKIPPED: 0
```

Artifacts:

- `qa-starter\chrome-extension-ai-qa-starter\results\review-summary.md`
- `qa-starter\chrome-extension-ai-qa-starter\results\spreadsheet-import.csv`
- `qa-starter\chrome-extension-ai-qa-starter\results\thinkfirst-qa-notes.md`

Important QA note: after the full 2,000-case summary was generated, `P20-T096` was tightened and re-run as a targeted post-fix test. That targeted test passed. Because of that targeted run, `results\playwright-results.json` was overwritten after the full summary. Re-run `npm.cmd run qa:matrix` and then `npm.cmd run qa:summarize` if raw JSON and summary files must come from the exact same run.

## 8. Bugs Fixed During Final Hardening

- Very short AI answers now count as complete once stable. The detector no longer ignores responses only because they are under 40 characters.
- Delete-all now clears the local pilot survey key `tf_pilot_survey_local`.
- Dashboard percentages are clamped to 0-100 so repeated behavior events cannot produce impossible ratios.
- QA handler bugs were fixed for empty input handling, verify selector scope, page/context cleanup, overlay strict locators, covered primary buttons, and clean reinstall recovery after storage reset.

## 9. Browser Compatibility

Supported now:

- Brave using `dist/`.
- Chrome and Chromium browsers using `dist/`.
- Edge using `dist-edge/` or `dist/`.

Experimental:

- Firefox using `dist-firefox/`.

Not one-click yet:

- Safari. Safari needs an Apple/Xcode Safari Web Extension packaging pass before it can be claimed as compatible.

Compatibility does not mean provider compatibility. The current provider adapter is ChatGPT. Gemini, Claude, Perplexity, and other AI sites need separate page adapters.

## 10. Honest Current Limitations

- Current production target is ChatGPT only.
- ChatGPT selectors may change because ChatGPT is a third-party website.
- Metrics are behavioral indicators, not validated learning outcomes.
- ThinkFirst does not determine whether an AI answer is factually true.
- Verification is a guided human workflow, not an automated fact-checking engine.
- Adaptive friction is local and heuristic, not machine learning.
- No teacher dashboard, cloud sync, class roster, or institutional backend is implemented yet.
- The QA matrix is broad and useful, but mostly deterministic/synthetic by default.
- `qa:login` requires manual login.
- Firefox is build-ready but still experimental until full manual click-through testing is completed.

## 11. UNESCO / Real-World Framing

ThinkFirst is strongest when presented as a human-agency and media-literacy layer for AI, not as a punishment tool.

The core claim:

```text
ThinkFirst helps users keep agency while using AI by embedding Generate, Evaluate, Verify, and Reflect habits inside ordinary AI workflows.
```

Why this matters:

- AI access is expanding faster than structured AI-literacy education.
- Students need support for evaluating, verifying, and reflecting on AI output.
- Banning AI and allowing unrestricted AI are not the only options.
- ThinkFirst offers a third path: structure the process without reading the conversation.

## 12. Roadmap

Near-term:

- More live testing on Chrome, Edge, Brave, and Firefox.
- More resilient ChatGPT adapter selectors.
- Gemini adapter.
- Claude adapter.
- Perplexity adapter.
- More accessible keyboard and screen-reader flows.
- More multilingual interface text.

Education:

- Teacher-created assignment modes.
- Aggregate-only completion reporting.
- Student consent and privacy controls.
- Printable GEVR classroom materials.

Research:

- Consented research mode.
- Anonymous aggregate export.
- Separate external learning assessments.
- Controlled comparison of ordinary AI use versus ThinkFirst-supported AI use.

Product:

- Store-ready packaging.
- Signed releases.
- Optional import/export of local settings.
- Stronger privacy audit page.
- Community MIL toolkit.

## 13. Final Deliverables In This Workspace

- Source extension: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\src`
- Manifest: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\manifest.json`
- Chromium build: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist`
- Edge build: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist-edge`
- Firefox build: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\dist-firefox`
- Final ZIP: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\ThinkFirst-final-extension-2026-08-14.zip`
- Browser compatibility notes: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\BROWSER_COMPATIBILITY.md`
- Research grounding: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\RESEARCH_GROUNDING.md`
- Stress test report: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\STRESS_TEST_REPORT.md`
- QA harness: `C:\Users\Arv Bali\OneDrive\Documents\ChatGPT\unesco\qa-starter\chrome-extension-ai-qa-starter`

## 14. One-Sentence Submission Version

ThinkFirst is a privacy-preserving browser extension that helps students use generative AI without outsourcing their judgment by guiding them through Generate, Evaluate, Verify, and Reflect habits across ordinary AI workflows.
