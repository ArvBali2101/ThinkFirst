# ThinkFirst Stress Test Report

Date: 2026-08-13

## Summary

ThinkFirst was stress tested across unit logic, high-volume local event handling, privacy sanitization, manifest permissions, HTML asset contracts, JavaScript syntax, production build output, browser-targeted builds, and live Brave rendering.

Final result: passed.

## Checks Run

- Full unit suite with Node test runner.
- High-volume reducer simulation across 80 learning sessions and hundreds of intervention events.
- Duplicate event ID replay test.
- Source-click, copy-event, quick-copy, large-copy, passive-acceptance, and School Mode process-check tests.
- Event log, session log, and recent event ID cap checks.
- Dashboard metric finite-value and 0-100 percentage checks.
- Measurement model coverage for every dashboard metric.
- Prompt-timing model coverage for Attempt, Evaluate, Verify, School Check, and Retrieve/checkpoint decision points.
- Privacy sanitizer test for forbidden content fields.
- Manifest permission audit.
- Manifest asset existence check.
- HTML script/CSS reference check.
- JavaScript syntax check for all source, script, and test files.
- Production `dist` build contract check.
- Browser-targeted build checks for `dist/`, `dist-edge/`, and `dist-firefox/`.
- Live Brave smoke check with the unpacked extension loaded.
- Deep live smoke checks for Brave and Edge with temporary profiles.

## Live Browser Check

Temporary Brave profile:

- Browser reported: `Chrome/151.0.7922.137`.
- Extension loaded from `dist/`.
- ChatGPT target opened.
- ThinkFirst content script injected on `https://chatgpt.com/`.
- ThinkFirst pill rendered with `Quick`.
- Dashboard page rendered.
- Settings page rendered and showed `School / Assignment`.
- Onboarding page rendered.

Deep smoke pass:

- Brave live-loaded `dist/`.
- Edge live-loaded `dist-edge/`.
- ChatGPT page opened.
- ThinkFirst pill injected.
- Side panel opened from the pill.
- Side-panel tools included `School check`.
- Dashboard rendered with Measurement tab.
- Settings rendered with `School / Assignment`.
- Popup rendered with School mode.
- Settings save changed mode to `school` in extension storage.
- Delete-all flow cleared local pilot survey key `tf_pilot_survey_local`.

Chrome was installed, but this local Chrome build did not load unpacked extensions from the command line in temporary smoke profiles. The Chromium package was still build-checked, and Brave live-loaded the same `dist/` package successfully. Firefox was not installed on this machine, so Firefox compatibility was build-checked but not live-click-tested.

## Bug Found And Fixed

The stress suite found that repeated exercise events could make some dashboard percentages exceed 100%.

Fix:

- `clampPercent` now clamps all percentage outputs to the 0-100 range.
- Added a regression test to prevent recurrence.

Two later audit issues were also fixed:

- Very short assistant answers now count as complete once stable. The detector no longer ignores responses just because they are under 40 characters.
- Delete-all flows now clear the local pilot survey key `tf_pilot_survey_local` as well as the main `chrome.storage.local` behavior data.

## Privacy Result

The extension still requests only:

```json
["storage"]
```

No prompt text, AI response text, attempt text, reflection text, screenshots, clipboard contents, source URLs, or page HTML are persisted by ThinkFirst.

The sanitizer explicitly rejects content-shaped fields such as:

- `promptText`
- `responseText`
- `attemptText`
- `reflectionText`
- `clipboardText`
- `html`
- `url`
- `screenshot`

## Final Verification

```text
npm.cmd test      -> 30/30 passed
node --check      -> clean
npm.cmd run build:all -> built dist/, dist-edge/, dist-firefox/
dist contract     -> passed
live Brave check  -> passed
deep Brave/Edge smoke -> passed
```
