# ThinkFirst Browser Compatibility

## Supported Now

### Brave

Use the Chromium build:

```bash
npm.cmd run build
```

Load unpacked from:

```text
C:\Users\Arv Bali\OneDrive\Documents\PROJECTS\UNESCO\ThinkFirst\dist
```

### Google Chrome

Use the same Chromium build in `dist/`.

### Microsoft Edge

Use either `dist/` or the Edge-labelled build:

```bash
npm.cmd run build:edge
```

Load unpacked from `dist-edge/`.

### Opera and Other Chromium Browsers

Use the Chromium build in `dist/`. Compatibility depends on whether the browser supports MV3 extension service workers and the standard `chrome.storage`, `chrome.runtime`, and `chrome.tabs` APIs.

## Experimental Build

### Firefox

Firefox supports WebExtensions but differs from Chrome in MV3 background handling. The Firefox build changes the manifest background from Chrome's `background.service_worker` to Firefox's supported `background.scripts` fallback.

Build:

```bash
npm.cmd run build:firefox
```

Load temporarily in Firefox:

```text
about:debugging#/runtime/this-firefox
```

Choose `Load Temporary Add-on` and select:

```text
dist-firefox\manifest.json
```

Status: experimental. The source code uses the `chrome.*` WebExtension namespace, which Firefox supports for compatibility, but a full manual Firefox click-through is still required.

## Not One-Click Yet

### Safari

Safari Web Extensions use the same general web-extension technologies, but distribution and testing require an Apple/Xcode wrapper. ThinkFirst needs a Safari packaging pass before it can be honestly called Safari-compatible.

## Compatibility Notes

- ThinkFirst currently supports ChatGPT URLs only.
- Browser compatibility does not mean provider compatibility. Gemini, Claude, and Perplexity need separate page adapters.
- The extension intentionally avoids broad permissions such as `tabs`, `history`, `clipboardRead`, `webRequest`, and `<all_urls>`.
- The extension stores local behavior metadata only, not prompts, AI responses, source URLs, clipboard contents, assignment text, or reflection text.
