# ThinkFirst Extreme Manual Test Guide

Use this guide to test ThinkFirst like a real student tester and like a product reviewer. The goal is not only "does something pop up?" The goal is to check whether the right prompt appears at the right moment, in the right mode, with the right dashboard evidence afterwards.

Project folder:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst
```

Chromium/Chrome/Brave extension folder:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist
```

Edge build:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist-edge
```

Firefox experimental build:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist-firefox
```

Final ZIP:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\ThinkFirst-final-extension-2026-08-14.zip
```

## 1. What You Are Testing

ThinkFirst has five main modes:

| Mode | What it is for | Main expected behavior |
|---|---|---|
| Quick | Efficient answer | No learning prompts. Dock may show minimal state, but ThinkFirst should stay quiet. |
| Learn | Understand something | Attempt First before AI, then Compare after AI if no sources, Verify if sources are present. |
| Research | Factual investigation | Attempt First, then Verify after the AI answer. Source checking is prioritized. |
| Create | Writing, design, brainstorming | Attempt First, then authorship/voice Compare if no sources. If sources appear, Verify comes first. |
| School | Assignment/exam process | Required typed Attempt First with no skip path, source Verify if sources appear, otherwise School Check after answer. Assistant-answer copying is blocked when the School copy blocker is on. |

ThinkFirst is testing the GEVR loop:

```text
Generate -> Evaluate -> Verify -> Reflect
```

The extension should never store prompt text, AI answer text, source URLs, clipboard text, attempt text, or reflection text. The dashboard stores local behavior events only.

## 2. Install Or Reload The Correct Extension

Use this every time you test a new build.

### Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on `Developer mode`.
4. If ThinkFirst is already loaded, click its reload button.
5. If it is not loaded, click `Load unpacked`.
6. Select:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist
```

### Brave

1. Open Brave.
2. Go to `brave://extensions` or `chrome://extensions`.
3. Turn on `Developer mode`.
4. Reload ThinkFirst or load unpacked from:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist
```

### Edge

1. Open Edge.
2. Go to `edge://extensions`.
3. Turn on `Developer mode`.
4. Load unpacked from:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist-edge
```

## 3. Clean Baseline Before Testing

Do this before a serious test run.

1. Open ChatGPT.
2. Click the ThinkFirst extension icon.
3. Click `Open My Learning Habits`.
4. Open the `Privacy` tab.
5. Click `Delete all ThinkFirst data`.
6. Confirm the local data/event timeline resets.
7. Go back to `chrome://extensions` or `brave://extensions`.
8. Click the reload button on ThinkFirst.
9. Open a fresh ChatGPT tab.

Expected result:

| Check | Expected |
|---|---|
| Dashboard Today tab | Mostly zero values. |
| Privacy tab counters | Conversation text stored = 0 B, attempt/reflection text stored = 0 B. |
| Privacy Inspector | Empty or only new session/setup events after you start testing. |
| Popup mode | Whatever default mode is set to. |

## 4. Set Stress-Test Settings

Open ThinkFirst popup, then `Privacy & Settings`.

Use these settings for the main extreme test:

| Setting | Value |
|---|---|
| Default mode | Change depending on the test case. |
| Attempt First | On |
| Ask before every message legacy | Off |
| Compare | On |
| Verify | On |
| Reflect | On |
| Commitment Mode | Off for normal tests, On only for commitment test. |
| Prompt frequency | Strong |
| Verification level | Advanced |
| Prompt complexity | Advanced |
| Automatic prompts per session | 4 |
| Cooldown after automatic prompt | 3 minutes |
| ThinkFirst Understanding | Maximum Privacy or Local Context. |
| Disable all local history | Off if you want dashboard metrics. |
| Dyslexia-friendly display | Test both Off and On once. |

Important: if local history is disabled, dashboard metrics may not behave like a normal test. Keep history enabled for metric testing.

## 5. Timing Rules

This is the most important part.

| Situation | How long to wait | Expected behavior |
|---|---:|---|
| Open a fresh ChatGPT page in Learn/Research/Create/School | 1 to 3 seconds | Attempt First should appear automatically. It starts trying around 0.9 seconds and retries for about 21 seconds. |
| Type in ChatGPT composer in active mode | 1 to 2 seconds | Attempt First may appear before you send. |
| Click ChatGPT send while Attempt First is enabled | Immediate | ChatGPT send should pause and Attempt First should appear. |
| School/Commitment first attempt | Immediate | ChatGPT cannot be used until a typed Attempt First is completed. The skip button should not appear. |
| After you complete Attempt First and AI responds | Wait until answer finishes, then 1 to 3 seconds | Compare, Verify, or School Check should appear depending on mode/source. |
| If AI answer has visible links/sources | 1 to 3 seconds after answer finishes | Verify should appear first in Learn, Research, Create, and School. |
| Later automatic prompts in same session | At least 3 minutes and at least 3 more exchanges | A later checkpoint/retrieval prompt can appear. |
| After two skips in one session | No more automatic prompts expected | ThinkFirst backs off after repeated skips. |
| Manual dock tools | Immediate | Clicking ThinkFirst dock tools should open the selected tool even if automatic timing does not. |

Automatic prompt budget:

| Mode/settings | Budget behavior |
|---|---|
| Learn/Create default | Uses configured automatic prompt budget. |
| Research/School | At least 3 automatic prompts allowed. |
| Commitment Mode | At least 4 automatic prompts allowed. |
| Default budget 2 | Attempt First often uses one slot, first post-answer nudge can use another, then later automatic prompts may stop. |
| Stress budget 4 | Better for testing more prompts in one session. |

## 6. Exact Prompt Order Rules

Use this table to know what should happen.

| Mode | AI answer has visible source links? | First pre-answer prompt | First post-answer automatic prompt |
|---|---|---|---|
| Quick | No or yes | None | None |
| Learn | No | Attempt First | Compare |
| Learn | Yes | Attempt First | Verify |
| Research | No | Attempt First | Verify |
| Research | Yes | Attempt First | Verify |
| Create | No | Create-style Attempt First | Authorship/voice Compare |
| Create | Yes | Create-style Attempt First | Verify |
| School | No | School-style Attempt First | School Check |
| School | Yes | School-style Attempt First | Verify |

Manual dock tools should still let you open:

```text
Attempt / Compare / Verify / School Check / Finish Learning
```

The exact visible buttons depend on current mode and session stage.

## 7. Test Data Sheet Columns

Use these columns in your notes or spreadsheet.

| Column | What to write |
|---|---|
| Test ID | Example: L01, R02, C03. |
| Browser | Chrome, Brave, Edge. |
| Mode | Quick, Learn, Research, Create, School. |
| Settings | Budget, cooldown, verification level, commitment on/off. |
| Prompt sent to ChatGPT | You can write the prompt in your notes; ThinkFirst should not store it. |
| Sources visible? | Yes/No. |
| Expected first prompt | Attempt, Compare, Verify, School Check, none. |
| Actual first prompt | What appeared. |
| Wait time | Seconds waited after page load or AI answer. |
| Action taken | Done, Skip, source clicked, copied answer, manual tool opened. |
| Dashboard expected | Metric/event that should change. |
| Dashboard actual | What changed. |
| Pass/Fail | Pass, fail, unclear. |
| Screenshot | File name or note. |

## 8. Core Test Run: 60 To 90 Minutes

This is the recommended serious test.

### Test Q01: Quick Mode Should Stay Quiet

Setup:

1. Popup -> choose `Quick`.
2. Open a fresh ChatGPT chat.
3. Wait 5 seconds.

Prompt:

```text
Explain photosynthesis in three sentences.
```

Expected:

| Step | Expected |
|---|---|
| On page open | No Attempt First modal. |
| After sending prompt | No modal blocking send. |
| After AI answer | No Compare, Verify, Reflect, or School Check. |
| Dashboard | No new learning session should be counted for Quick mode. |

Fail if:

- Any learning modal appears automatically.
- Dashboard treats Quick as a learning session.

### Test L01: Learn Mode, No Sources, Compare Appears

Setup:

1. Popup -> choose `Learn`.
2. Open a fresh ChatGPT chat.
3. Wait 1 to 3 seconds.

Expected first modal:

```text
Before AI answers - what do you think?
```

Fill:

| Field | Suggested selection |
|---|---|
| Session goal | Understand something |
| Readiness | I know part of it |
| My attempt | `Plants use light to make food, but I am unsure about the exact process.` |

Then send:

```text
Explain photosynthesis in three sentences without using links or citations.
```

Wait:

```text
After ChatGPT finishes, wait 1 to 3 seconds.
```

Expected post-answer modal:

```text
Compare, don't just replace.
```

Select:

```text
Added something I missed
```

Write:

```text
AI explained the role of carbon dioxide and glucose more clearly.
```

Click `Done`.

Dashboard checks:

| Tab | Expected |
|---|---|
| Today | Learning sessions +1, Generated first shows at least 1/1. |
| Habits | Attempt Rate increases, Compare Rate increases. |
| Privacy | Event timeline contains session_started, attempt_prompt_shown, attempt_completed, assistant_response_completed, evaluation_prompt_shown, evaluation_completed. |
| Measurement | Attempt Rate says what raises it and what it is measured against, not raw Numerator/Denominator headings. |

### Test L02: Learn Mode, Sources Visible, Verify Appears Instead Of Compare

Setup:

1. Keep mode `Learn`.
2. Open a fresh ChatGPT chat.
3. Complete Attempt First.

Prompt:

```text
Give me two reliable sources with full https links about UNESCO media and information literacy. Summarize one claim from each source.
```

Wait:

```text
After ChatGPT finishes, wait 1 to 3 seconds.
```

Expected:

```text
Verify / Check the source prompt appears first.
```

Complete the Verify workflow:

| Step | What to do |
|---|---|
| Claim | Pick one factual claim from the answer. |
| Source | Notice who produced the evidence. |
| Support | Decide whether the source supports the claim. |
| Lateral check | Open or search for an independent source. |
| Judgment | Choose Supported, Contradicted, or Uncertain. |

Dashboard checks:

| Tab | Expected |
|---|---|
| Habits | Verification Activity increases. |
| Habits | Independent Cross-checking increases if you marked cross-check done. |
| Habits | Source-link Inspection increases if you clicked a source link from the AI answer. |
| Privacy | Source URL should not be stored. Event timeline may show source_clicked, verify_prompt_shown, verify_prompt_completed. |

Fail if:

- Compare appears first even though the AI answer has visible links.
- Source URLs appear in stored local data.

### Test R01: Research Mode Always Prioritizes Verify

Setup:

1. Popup -> choose `Research`.
2. Fresh ChatGPT chat.
3. Wait for Attempt First.

Attempt text:

```text
I need to verify whether this claim is supported and who says it.
```

Prompt without asking for links:

```text
Is daily caffeine intake linked to sleep quality? Give a balanced answer.
```

Expected:

| Step | Expected |
|---|---|
| Before AI | Research-style Attempt First. |
| After AI answer | Verify prompt appears, even if there are no visible sources. |
| Verify level | If settings are Advanced, it should include independent/lateral checking language. |

Dashboard:

- Verification Eligible should increase.
- Verification Activity increases only if you complete Verify.
- If you skip, Intervention Skip Rate increases.

### Test C01: Create Mode, No Sources, Authorship Compare Appears

Setup:

1. Popup -> choose `Create`.
2. Fresh ChatGPT chat.
3. Complete Create-style Attempt First.

Prompt:

```text
Help me brainstorm three titles for a student article about responsible AI use. Do not include sources or links.
```

Expected after answer:

```text
Create/authorship Compare appears.
```

The options should be about voice, authorship, intent, rewriting, or what is still yours. It should not feel like a factual research form.

Good expected options include ideas like:

```text
AI changed my voice too much
I need to rewrite this in my own words
I'm not sure what is still mine
```

Fail if:

- It shows only research/source wording.
- It asks mainly about disagreeing with factual evidence when the task is creative.

Dashboard:

- Attempt Rate increases.
- Compare Rate increases if completed.
- Challenge/Disagreement only increases if you choose challenge/disagree category.

### Test C02: Create Mode, Sources Visible, Verify Appears First

Setup:

1. Popup -> choose `Create`.
2. Fresh ChatGPT chat.
3. Complete Attempt First.

Prompt:

```text
Write a short campaign paragraph about digital literacy and include two full https source links that support the claims.
```

Expected:

| Step | Expected |
|---|---|
| After answer with links | Verify appears first. |
| After Verify | Manual Compare should still be available from the ThinkFirst dock if you want authorship checking. |

Why this matters:

Sources are a stronger immediate cue than authorship. If the AI gave evidence, the first responsibility is to check it.

### Test S01: School Mode, No Sources, School Check Appears

Setup:

1. Popup -> choose `School`.
2. Fresh ChatGPT chat.
3. Wait for Attempt First.

Expected Attempt First form:

The form should be divided into school-specific sections, such as:

```text
1. Session goal
2. What kind of school task is this?
3. What does your teacher allow?
4. How much can you do before AI?
5. What feels unclear?
```

Prompt:

```text
Help me plan a history assignment about causes of World War I. Do not include links.
```

Expected after answer:

```text
School Check appears.
```

School Check should ask about:

- Assignment stage.
- What the teacher allows.
- Whether source checking or rewriting is needed.
- What remains your own contribution.

Dashboard:

- School Process Checks increases if completed.
- School sessions increases.

### Test S02: School Mode, Sources Visible, Verify Appears Before School Check

Setup:

1. Popup -> choose `School`.
2. Fresh ChatGPT chat.
3. Complete School Attempt First.

Prompt:

```text
Help me find sources for a history assignment about causes of World War I. Include full https links and explain what each source supports.
```

Expected:

```text
Verify appears first because sources are visible.
```

After Verify:

- Use the dock to manually open `School check`.
- Confirm School Check still works.

Dashboard:

- Verification Activity increases after Verify completion.
- School Process Checks increases after manual School Check completion.
- Source-link Inspection increases if you clicked a source link.

### Test F01: Reflection / Finish Learning

Reflection is not always automatic immediately. It is meant for later retrieval or when manually opened.

Setup:

1. Use Learn mode.
2. Complete Attempt First.
3. Get one AI answer.
4. Use the ThinkFirst dock.
5. Click a retrieval/finish learning/reflection tool if visible.

Expected:

- Reflection asks you to explain the key idea without looking back.
- Reflection text is not saved.
- Dashboard Reflection Rate increases only if you complete it.
- Privacy Inspector should show reflection_prompt_shown and reflection_prompt_completed, not your typed reflection.

### Test M01: Manual Dock Tools

Setup:

1. Use any active mode except Quick.
2. Open ChatGPT.
3. Look for ThinkFirst dock in the bottom/right area.
4. Click it.

Expected:

| Tool | Expected behavior |
|---|---|
| Verify this | Opens Verify workflow. |
| School check | Opens School Check, especially useful in School mode. |
| Finish Learning / Reflect | Opens retrieval/reflection workflow. |
| Compare | Opens Compare if available in current stage. |

Manual tools are important because automatic prompts are intentionally limited.

### Test P01: Pause Site

Setup:

1. Open ThinkFirst popup on ChatGPT.
2. Turn on `Pause ThinkFirst on this site`.
3. Refresh ChatGPT.
4. Send a prompt in Learn mode.

Expected:

- No Attempt First.
- No Compare.
- No Verify.
- No School Check.

Then turn pause off and refresh ChatGPT.

Expected:

- ThinkFirst prompts return.

### Test C03: Copy Detection

Setup:

1. Use Learn mode.
2. Ask for a medium-length answer.
3. Wait for the answer to finish.
4. Select a paragraph from the AI answer.
5. Press Ctrl+C.

Expected:

| Dashboard area | Expected |
|---|---|
| Habits | AI-answer Copy Events may increase. |
| Habits | Large Copy Rate increases if selection is large. |
| Habits | Quick Copy Rate increases if copied within about 20 seconds of answer completion. |
| Privacy | Clipboard contents should not be stored. |

Fail if:

- The copied text appears in local data.
- Clipboard permissions are requested. The extension should not need clipboardRead.

### Test C04: School Integrity Pause / Copy Blocker

Setup:

1. Open ThinkFirst settings.
2. Turn `School copy blocker` on.
3. Choose `School` mode, or choose any active mode with `Commitment Mode` on.
4. Open a fresh ChatGPT chat.
5. Complete Attempt First.
6. Ask for a long assignment-style answer.

Prompt:

```text
Draft a long answer for a school assignment about the causes of climate change. Make it at least 700 words.
```

Trigger:

1. Wait for ChatGPT to finish.
2. Select a large part of the assistant answer, ideally multiple paragraphs.
3. Press Ctrl+C within 20 seconds if possible.

Expected:

| Check | Expected |
|---|---|
| Clipboard | The copy should be blocked before it is copied. |
| Modal | `Assignment integrity pause` appears. |
| Timer | Countdown starts at 10:00. |
| Language | It should not say the student cheated. It should say this is an assignment-risk moment. |
| Early unlock | Clicking `Do school check` opens School Check. Completing it unlocks the pause. |
| ChatGPT sending | While the pause is active, sending another ChatGPT message should be blocked and the pause should reappear. |
| Dashboard Today | `Integrity pauses` increases. |
| Privacy Inspector | Shows `assistant_copy_detected` and `school_integrity_pause_started`, but no copied text. |

Important:

- In School Mode or Commitment Mode, any assistant-answer copy attempt should trigger the blocker while `School copy blocker` is on.
- Copying outside the assistant answer should not count as assistant-answer copying.
- The blocker is active only in School Mode or Commitment Mode.

Fail if:

- The copied text appears in local data.
- The blocker appears in Quick Mode.
- It accuses the user of cheating.
- It allows assistant-answer copying in School/Commitment while the blocker is on.

### Test SRC01: Source Click Detection

Setup:

1. Ask ChatGPT for an answer with full source links.
2. Wait for the answer to finish.
3. Click one visible source link from the assistant answer.

Expected:

| Dashboard area | Expected |
|---|---|
| Habits | Source-link Inspection increases. |
| Privacy Inspector | source_clicked event appears. |
| Stored data | No full URL stored. |

### Test E01: Broad Exam Guard

Setup:

1. Open ThinkFirst settings.
2. Turn `Enable Exam Guard` on.
3. Keep keywords such as `quiz`, `exam`, `assessment`, `test`, `midterm`, and `final`.
4. Keep blocked sites such as `gemini.google.com`, `claude.ai`, `perplexity.ai`, `chegg.com`, `coursehero.com`, `brainly.com`, and `quizlet.com`.
5. Open any test page whose URL, title, or page text includes `quiz`, `exam`, or `assessment`.

Expected on the exam-like page:

| Check | Expected |
|---|---|
| Exam detection | A small `ThinkFirst Exam Mode active` notice appears. |
| Copy | Copy/cut from the exam page is blocked. |
| Right-click | Context menu is blocked where the browser allows it. |
| Selection | Text selection is disabled where possible. |
| Tab switch | Leaving and returning to the tab records a temporary warning count and shows a reminder. |
| Privacy | No exam question text, page title, or page URL is stored. |

Expected on ChatGPT while Exam Mode is active:

| Check | Expected |
|---|---|
| Warning banner | `Exam Mode active - use AI only for learning.` |
| Paste | Paste into ChatGPT prompt is blocked. |
| Bulk insert | Long pasted/bulk chunks are blocked. |
| Suspicious prompt | Prompt that looks like an exam question is stopped before submission. |
| Redirect suggestion | Modal suggests asking for topic explanation, method teaching, or a fresh practice example. |

Expected on configured blocked sites:

| Check | Expected |
|---|---|
| Other AI / answer site | Full-page Exam Mode blocker appears while exam mode is active. |
| Interaction | Clicks, typing, copy, paste, and right-click are blocked by the overlay where possible. |

Important limitation:

ThinkFirst Exam Guard is not a lockdown browser. A normal extension cannot fully prevent disabling, using another browser/profile/device, screenshots, photos, or operating-system-level copying. It is a visible, local, privacy-preserving guardrail.

## 9. Settings Test Matrix

Run each setting test in a fresh ChatGPT chat after changing the setting.

| Test ID | Setting changed | Steps | Expected |
|---|---|---|---|
| SET01 | Attempt First Off | Learn mode, fresh chat, send prompt | No pre-answer Attempt First. Post-answer Compare/Verify may still appear if eligible. |
| SET02 | Compare Off | Learn mode, no-source answer | No automatic Compare after answer. Verify may still appear if sources are present. |
| SET03 | Verify Off | Research mode or sourced answer | No automatic Verify. Manual Verify may be unavailable or should not auto-open. |
| SET04 | Reflect Off | Use dock/later session | No automatic reflection/retrieval prompt. |
| SET05 | Commitment Mode On | Learn mode, fresh chat | Attempt First should not offer a normal skip path; user has voluntarily made attempt stronger. |
| SET06 | Budget 1 | Learn mode | After Attempt First, later automatic prompts may be limited. Manual tools should still work. |
| SET07 | Budget 4 | Learn/Research/School | More automatic prompts can appear across the session. |
| SET08 | Cooldown 3 min | Same session, multiple exchanges | Later auto prompt should not appear until 3 minutes and 3 exchanges pass, unless bypassed on first response. |
| SET09 | Dyslexia-friendly On | Refresh ChatGPT | ThinkFirst UI should use dyslexia-friendly presentation. No layout break. |
| SET10 | Clear all data | Settings or Dashboard Privacy | Dashboard counters and pilot survey should clear. |
| SET11 | School copy blocker Off | School mode, copy an assistant answer | Copy detection may still be counted, but the 10-minute integrity blocker should not appear. |
| SET12 | Exam Guard Off | Open exam-like page and ChatGPT | No exam notice, no ChatGPT exam banner, no exam paste blocking. |

## 10. Dashboard Test Guide

Open dashboard:

1. Click ThinkFirst extension icon.
2. Click `Open My Learning Habits`.

Or from settings:

1. Click ThinkFirst extension icon.
2. Click `Privacy & Settings`.
3. Click `My Learning Habits`.

### Today Tab

Check:

| Card | What it means |
|---|---|
| Learning sessions | Non-Quick sessions started today. |
| Generated first | Attempt completed / attempt opportunity. |
| Retrieved afterwards | Reflection/retrieval completions. |
| Verification exercises | Completed Verify workflows. |
| Integrity pauses | School/Commitment copy blockers started today. |

### Habits Tab

Check these after the relevant tests:

| Metric | How to make it move |
|---|---|
| Attempt Rate | Complete Attempt First. |
| Independent-start Frequency | Start a non-Quick session and complete first attempt. |
| Compare Rate | Complete Compare. |
| Challenge / Disagreement Rate | Choose challenge/disagree in Compare. |
| Verification Activity | Complete Verify. |
| Independent Cross-checking | Complete Verify and mark cross-check done. |
| Source-link Inspection | Click a source link in an AI answer. |
| Reflection Rate | Complete Reflection / Finish Learning. |
| Follow-up Exploration | Send another user message after an AI answer. |
| AI-answer Copy Events | Copy text from an assistant answer. |
| Quick Copy Rate | Copy soon after answer completion. |
| Large Copy Rate | Copy a large selection from an assistant answer. |
| First-response Stopping | End/leave a session after first answer without follow-up. |
| Passive Acceptance Proxy | End after answer with no visible checking move. |
| School Process Checks | Complete School Check. |
| Intervention Skip Rate | Skip ThinkFirst prompts. |

### Insights Tab

Expected:

- Shows adaptive guidance, not a grade.
- Should not call the user smart/dumb or diagnose critical thinking.
- Should suggest next actions like Verify, Reflect, or Compare.

### Evidence Tab

Expected:

- Shows research grounding.
- Explains that metrics are observable habits, not intelligence or ability.
- Lists sources used for the design logic.

### Measurement Tab

Expected:

- Cards should not look like raw `Numerator` / `Denominator` headings.
- Cards should say things like:

```text
What raises this metric
What it is measured against
When it updates
What triggers the event
Privacy boundary
What it cannot tell you
```

Also check `How Prompt Timing Works`:

- It should explain decision points and burden rules.
- It should make clear ThinkFirst backs off when timing is poor.

### Privacy Tab

Expected counters:

| Counter | Expected |
|---|---|
| Conversation text stored | 0 B |
| Attempt text stored | 0 B |
| Reflection text stored | 0 B |
| Clipboard text stored | 0 B or not stored |
| External ThinkFirst requests | 0 |

Expected buttons:

| Button | Expected |
|---|---|
| View locally stored data | Shows local metadata/events only. |
| Export aggregate metrics | Downloads/exports aggregate data. |
| Delete all ThinkFirst data | Clears extension state and pilot survey. |

### Framework Tab

Expected:

- Shows GEVR: Generate, Evaluate, Verify, Reflect.
- Shows mode explanations.
- Shows roadmap honestly as prototype/next/future.

### Pilot Tab

Expected:

- Survey saves locally.
- Clear survey removes survey data.
- Delete all ThinkFirst data should also clear this survey.

## 11. Privacy Red-Team Checks

After doing Attempt, Verify, Reflect, Copy, and Source tests:

1. Dashboard -> Privacy.
2. Click `View locally stored data`.
3. Search visually for:

```text
Your original ChatGPT prompt
AI answer text
Attempt text
Reflection text
Full source URL
Copied text
Assignment text
```

Expected:

None of those should appear.

Allowed event/category examples:

```text
attempt_completed
assistant_response_completed
sourcePresent: true
verify_prompt_completed
crossCheckCompleted: true
sourceJudgement: supports
readiness: know_part
unfamiliar: concept
copiedRangeClass: large
secondsAfterResponse: small timing number
schoolTaskType: assignment
aiUseRule: allowed_with_citation
```

Fail immediately if:

- Full prompt text is stored.
- AI answer text is stored.
- Source URL is stored.
- Clipboard content is stored.
- Reflection/attempt content is stored.

## 12. Browser Compatibility Test

Run a smaller version of the flow in each browser.

| Browser | Build folder | Required mini-test |
|---|---|---|
| Chrome | `dist` | Learn mode Attempt + Compare. |
| Brave | `dist` | Learn mode Attempt + Verify with sources. |
| Edge | `dist-edge` | School mode Attempt + School Check. |
| Firefox | `dist-firefox` | Install/load only if browser supports the build; treat as experimental. |

For each browser:

1. Load/reload extension.
2. Open ChatGPT.
3. Open ThinkFirst popup.
4. Change mode.
5. Run one fresh chat.
6. Open dashboard.
7. Confirm metrics update.

## 13. Failure Diagnosis

Use this before deciding a bug is real.

| Problem | Check this first |
|---|---|
| No Attempt First on page open | Are you in Quick mode? Is the site paused? Is Attempt First off? Is this a fresh chat with no prior messages? Wait up to 21 seconds. |
| Attempt First only appears after typing | ChatGPT page may not expose the composer immediately. This is acceptable if it appears before send. |
| Compare does not appear | Did the answer contain source links? If yes, Verify should appear instead. Is Compare off? Did auto budget run out? Did you skip twice? |
| Verify does not appear for sources | Were there actual visible `https` links in the assistant answer? Plain citation text without links may not count. Is Verify off? |
| School Check does not appear | Did the answer contain sources? If yes, Verify appears first. Use manual School Check after Verify. |
| Later checkpoint does not appear | Need at least 3 exchanges and cooldown time. Use budget 4 and cooldown 3 minutes for stress tests. |
| Dashboard does not update | Refresh the dashboard tab. Check history setting. Confirm you are not in Quick mode. |
| Source-link metric does not move | You must click a visible source link inside the assistant answer. |
| Copy metric does not move | Select text from the assistant answer itself, then Ctrl+C. Some browser/page selections may not be detected if outside the assistant response. |

## 14. Minimum Pass Criteria

The build is acceptable for tester release if all of these pass:

| Area | Pass condition |
|---|---|
| Install | Loads in Chrome or Brave from `dist`. |
| Popup | Mode cards work; no duplicate dropdown. |
| Quick | No automatic learning prompts. |
| Learn | Attempt First appears before first answer; Compare appears after no-source answer. |
| Sources | Any visible sourced answer triggers Verify first, including Create and School. |
| Research | Verify appears after answer. |
| Create | No-source answer uses authorship Compare, not research Compare. |
| School | School Attempt First is divided clearly; no-source answer shows School Check. |
| School copy blocker | Assistant-answer copying in School/Commitment Mode starts a 10-minute Assignment Integrity Pause, blocks ChatGPT sending during the pause, and stores no copied text. |
| Dashboard | Today, Habits, Measurement, Privacy tabs update logically. |
| Privacy | No prompt, answer, source URL, attempt, reflection, or clipboard text stored. |
| Data deletion | Delete all clears behavior data and pilot survey. |
| Tests | `npm.cmd test` passes. |

## 15. Suggested Full Test Schedule

| Block | Time |
|---|---:|
| Install/reload + reset baseline | 10 minutes |
| Quick + Learn no-source | 10 minutes |
| Learn with sources + source click | 10 minutes |
| Research mode | 10 minutes |
| Create no-source + sourced | 15 minutes |
| School no-source + sourced | 15 minutes |
| Copy detection + reflection/manual dock | 10 minutes |
| Dashboard all tabs | 15 minutes |
| Settings matrix spot checks | 20 minutes |
| Browser mini-test in Brave/Edge | 20 minutes |
| Privacy red-team | 10 minutes |

Total serious run:

```text
90 to 145 minutes
```

Fast smoke run:

```text
20 to 30 minutes
```

## 16. Command Checks For You

Run from:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst
```

Test:

```powershell
npm.cmd test
```

Build:

```powershell
npm.cmd run build:all
```

Refresh ZIP:

```powershell
Compress-Archive -Path .\dist\* -DestinationPath .\ThinkFirst-final-extension-2026-08-14.zip -Force
```

Check latest commit:

```powershell
git log -1 --oneline
```

## 17. One-Page Student Tester Script

Give this to a university student tester if you want realistic feedback.

1. Install/load ThinkFirst.
2. Choose Learn mode.
3. Open ChatGPT fresh.
4. Wait 3 seconds.
5. Complete the first ThinkFirst prompt honestly.
6. Ask ChatGPT one learning question.
7. Wait for the AI to finish, then wait 3 seconds.
8. Complete the ThinkFirst prompt that appears.
9. Ask ChatGPT for sources on the same topic.
10. Click one source and complete Verify.
11. Copy one paragraph from the AI answer.
12. Open My Learning Habits.
13. Check Today, Habits, Measurement, Privacy.
14. Answer:
    - Did ThinkFirst appear at the right time?
    - Was any prompt annoying or confusing?
    - Did the dashboard explain what it measured?
    - Did Privacy make you trust it more or less?
    - Would you keep using it voluntarily?

Expected testing time:

```text
15 to 25 minutes
```
