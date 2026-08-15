const $ = (selector) => document.querySelector(selector);

let snapshot = await send({ type: "GET_SNAPSHOT" });
render();

$("#modeSelect").addEventListener("change", async (event) => {
  snapshot = await send({
    type: "UPDATE_SETTINGS",
    patch: { mode: event.target.value }
  });
  snapshot = await send({ type: "GET_SNAPSHOT" });
  render();
});

$("#pauseSite").addEventListener("change", async (event) => {
  const host = snapshot.providerStatus?.host || "chatgpt.com";
  const pausedSites = {
    ...(snapshot.settings.pausedSites || {}),
    [host]: event.target.checked
  };
  snapshot = await send({ type: "UPDATE_SETTINGS", patch: { pausedSites } });
  snapshot = await send({ type: "GET_SNAPSHOT" });
  render();
});

$("#dashboard").addEventListener("click", () => send({ type: "OPEN_DASHBOARD" }));
$("#settings").addEventListener("click", () => send({ type: "OPEN_SETTINGS" }));

function render() {
  const settings = snapshot.settings;
  const provider = snapshot.providerStatus;
  const detectedRecently = provider?.detected && Date.now() - provider.updatedAt < 90_000;
  $("#provider").textContent = detectedRecently ? "ChatGPT detected" : "ChatGPT supported";
  const mode = normalizeMode(settings.mode);
  $("#mode").textContent = `${labelForMode(mode)} active`;
  $("#modeSelect").value = mode;
  renderModeCards(mode);
  const host = provider?.host || "chatgpt.com";
  $("#pauseSite").checked = Boolean(settings.pausedSites?.[host]);
}

function renderModeCards(activeMode) {
  const modes = [
    ["quick", "Quick", "Efficient answer"],
    ["learn", "Learn", "Understand it"],
    ["research", "Research", "Verify claims"],
    ["create", "Create", "Keep voice"],
    ["school", "School", "Assignment process"]
  ];
  $("#modeCards").innerHTML = modes.map(([value, title, note]) => `
    <button class="popup-mode-card ${value === activeMode ? "is-active" : ""}" data-mode="${value}" type="button">
      <strong>${title}</strong>
      <span>${note}</span>
    </button>
  `).join("");
  $("#modeCards").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      snapshot = await send({ type: "UPDATE_SETTINGS", patch: { mode: button.dataset.mode } });
      snapshot = await send({ type: "GET_SNAPSHOT" });
      render();
    });
  });
}

function normalizeMode(mode) {
  return mode === "learning" ? "learn" : mode || "quick";
}

function labelForMode(mode) {
  return {
    quick: "Quick Mode",
    learn: "Learn Mode",
    research: "Research Mode",
    create: "Create Mode",
    school: "School Mode"
  }[mode] || "Quick Mode";
}

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || { ok: false }));
  });
}
