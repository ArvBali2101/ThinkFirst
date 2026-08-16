const fields = [
  "mode",
  "attemptEnabled",
  "askEveryPrompt",
  "evaluateEnabled",
  "verifyEnabled",
  "reflectEnabled",
  "commitmentMode",
  "schoolCopyBlocker",
  "examGuardEnabled",
  "examKeywords",
  "examBlockedSites",
  "intensity",
  "verificationLevel",
  "promptComplexity",
  "automaticInterventionBudget",
  "cooldownMinutes",
  "understandingMode",
  "historyEnabled",
  "dyslexiaFriendly"
];

let snapshot = await send({ type: "GET_SNAPSHOT" });
render();

for (const id of fields) {
  document.querySelector(`#${id}`).addEventListener("change", save);
}
document.querySelector("#dashboard").addEventListener("click", () => send({ type: "OPEN_DASHBOARD" }));
document.querySelector("#clear").addEventListener("click", clearData);
document.querySelector("#export").addEventListener("click", exportData);

function render() {
  const settings = snapshot.settings;
  document.querySelector("#mode").value = settings.mode === "learning" ? "learn" : settings.mode;
  document.querySelector("#attemptEnabled").checked = settings.attemptEnabled;
  document.querySelector("#askEveryPrompt").checked = settings.askEveryPrompt;
  document.querySelector("#evaluateEnabled").checked = settings.evaluateEnabled;
  document.querySelector("#verifyEnabled").checked = settings.verifyEnabled;
  document.querySelector("#reflectEnabled").checked = settings.reflectEnabled;
  document.querySelector("#commitmentMode").checked = settings.commitmentMode;
  document.querySelector("#schoolCopyBlocker").checked = settings.schoolCopyBlocker !== false;
  document.querySelector("#examGuardEnabled").checked = settings.examGuardEnabled !== false;
  document.querySelector("#examKeywords").value = settings.examKeywords || "";
  document.querySelector("#examBlockedSites").value = settings.examBlockedSites || "";
  document.querySelector("#intensity").value = settings.intensity;
  document.querySelector("#verificationLevel").value = settings.verificationLevel;
  document.querySelector("#promptComplexity").value = settings.promptComplexity;
  document.querySelector("#automaticInterventionBudget").value = String(settings.automaticInterventionBudget || 2);
  document.querySelector("#cooldownMinutes").value = String(settings.cooldownMinutes || 5);
  document.querySelector("#understandingMode").value = settings.understandingMode || "local-context";
  document.querySelector("#historyEnabled").checked = settings.historyEnabled;
  document.querySelector("#dyslexiaFriendly").checked = settings.dyslexiaFriendly;
}

async function save() {
  const patch = {
    mode: document.querySelector("#mode").value,
    attemptEnabled: document.querySelector("#attemptEnabled").checked,
    askEveryPrompt: document.querySelector("#askEveryPrompt").checked,
    evaluateEnabled: document.querySelector("#evaluateEnabled").checked,
    verifyEnabled: document.querySelector("#verifyEnabled").checked,
    reflectEnabled: document.querySelector("#reflectEnabled").checked,
    commitmentMode: document.querySelector("#commitmentMode").checked,
    schoolCopyBlocker: document.querySelector("#schoolCopyBlocker").checked,
    examGuardEnabled: document.querySelector("#examGuardEnabled").checked,
    examKeywords: document.querySelector("#examKeywords").value,
    examBlockedSites: document.querySelector("#examBlockedSites").value,
    intensity: document.querySelector("#intensity").value,
    verificationLevel: document.querySelector("#verificationLevel").value,
    promptComplexity: document.querySelector("#promptComplexity").value,
    automaticInterventionBudget: Number(document.querySelector("#automaticInterventionBudget").value),
    cooldownMinutes: Number(document.querySelector("#cooldownMinutes").value),
    understandingMode: document.querySelector("#understandingMode").value,
    historyEnabled: document.querySelector("#historyEnabled").checked,
    dyslexiaFriendly: document.querySelector("#dyslexiaFriendly").checked
  };
  await send({ type: "UPDATE_SETTINGS", patch });
  document.querySelector("#status").textContent = "Settings saved.";
}

async function clearData() {
  if (!confirm("Delete all locally stored ThinkFirst data, including the local pilot survey? Settings will stay in place.")) return;
  await send({ type: "CLEAR_DATA" });
  localStorage.removeItem("tf_pilot_survey_local");
  document.querySelector("#status").textContent = "All local ThinkFirst data deleted.";
}

async function exportData() {
  const response = await send({ type: "EXPORT_AGGREGATES" });
  const blob = new Blob([JSON.stringify(response.export, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `thinkfirst-aggregates-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || { ok: false }));
  });
}
