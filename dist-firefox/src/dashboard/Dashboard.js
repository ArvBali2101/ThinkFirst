import {
  EVIDENCE_LENSES,
  MEASUREMENT_MODEL,
  PROMPTING_MODEL,
  RESEARCH_SOURCES
} from "../shared/evidence.js";

const metricCopy = [
  ["Generation", "attemptRate", "Attempt Rate", "How often you made your own attempt before using AI assistance."],
  ["Generation", "independentStartFrequency", "Independent-start Frequency", "How often a learning session began with your own attempt."],
  ["Evaluation", "compareRate", "Compare Rate", "How often you compared AI output with your own reasoning."],
  ["Evaluation", "challengeRate", "Challenge / Disagreement Rate", "How often you challenged or disagreed with part of an answer."],
  ["Verification", "verificationActivity", "Verification Activity", "How often you used ThinkFirst's source-check workflow when verification was relevant."],
  ["Verification", "independentCrossCheckRate", "Independent Cross-checking", "How often verification included an independent source check."],
  ["Verification", "sourceInspectionRate", "Source-link Inspection", "How often you opened sources from AI answers when source links were present."],
  ["Reflection", "reflectionRate", "Reflection Rate", "How often you explained the key idea in your own words after using AI."],
  ["Reliance", "followupExploration", "Follow-up Exploration", "How often you continued exploring after the first AI answer."],
  ["Reliance", "assistantCopyEventRate", "AI-answer Copy Events", "How often AI responses led to a copy action from the assistant answer."],
  ["Reliance", "quickCopyRate", "Quick Copy Rate", "How often AI-answer copies happened within 20 seconds of the answer stabilizing."],
  ["Reliance", "largeCopyRate", "Large Copy Rate", "How often copied AI-answer selections were large."],
  ["Reliance", "immediateCopyRate", "Immediate Copy Rate", "How often a large portion of an AI response was copied shortly after it appeared."],
  ["Reliance", "firstResponseStoppingRate", "First-response Stopping", "How often a session ended without a follow-up."],
  ["Reliance", "passiveAcceptanceRate", "Passive Acceptance Proxy", "How often a session ended after an AI answer without a visible checking or learning move."],
  ["School", "schoolProcessCheckRate", "School Process Checks", "How often School Mode sessions completed an AI-use process check."],
  ["Reliance", "interventionSkipRate", "Intervention Skip Rate", "How often you chose to skip ThinkFirst's learning prompts."]
];

let snapshot = await send({ type: "GET_SNAPSHOT" });
render();

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab.dataset.tab));
});
document.querySelector("#openSettings").addEventListener("click", () => send({ type: "OPEN_SETTINGS" }));
document.querySelector("#viewData").addEventListener("click", toggleLocalData);
document.querySelector("#exportData").addEventListener("click", exportAggregates);
document.querySelector("#deleteData").addEventListener("click", deleteData);
document.querySelector("#pilotForm").addEventListener("submit", savePilot);
document.querySelector("#clearPilot").addEventListener("click", clearPilot);

function render() {
  renderToday();
  renderInsights();
  renderMetrics();
  renderEvidence();
  renderMeasurement();
  renderTrend();
  renderPrivacy();
  renderEvents();
  restorePilot();
}

function renderToday() {
  const today = new Date().toISOString().slice(0, 10);
  const row = snapshot.state.daily?.[today] || {};
  const items = [
    ["Learning sessions", row.learningSessions || 0],
    ["Generated first", `${row.attemptCompleted || 0}/${row.attemptEligible || 0}`],
    ["Retrieved afterwards", row.retrievalCompleted || row.reflectionCompleted || 0],
    ["Verification exercises", row.verificationCompleted || 0]
  ];
  document.querySelector("#todayGrid").innerHTML = items.map(([label, value]) => `
    <article class="card">
      <h2>${label}</h2>
      <div class="metric-value">${value}</div>
      <p class="fineprint">Local interaction metadata only.</p>
    </article>
  `).join("");
}

function renderInsights() {
  document.querySelector("#adaptiveLevel").textContent = `Current local guidance level: ${snapshot.adaptiveLevel || "gentle"}`;
  document.querySelector("#insightsList").innerHTML = (snapshot.insights || [])
    .map((item) => `<li>${item}</li>`)
    .join("");
  const stats = snapshot.state.stats || {};
  document.querySelector("#effectivenessGrid").innerHTML = [
    ["Helpful", stats.helpfulFeedback || 0],
    ["Not useful", stats.notUsefulFeedback || 0],
    ["Manual tools used", stats.manualToolsUsed || 0],
    ["Skipped interventions", stats.interventionsSkipped || 0]
  ].map(([label, value]) => `
    <article class="card">
      <h2>${label}</h2>
      <div class="metric-value">${value}</div>
    </article>
  `).join("");
}

function renderMetrics() {
  const grid = document.querySelector("#metricGrid");
  grid.innerHTML = metricCopy.map(([group, key, title, description]) => {
    const lens = EVIDENCE_LENSES[key];
    const note = key === "immediateCopyRate"
      ? "<p class='fineprint'>This does not imply cheating or poor learning. It is only an interaction pattern.</p>"
      : "";
    return `
      <article class="card">
        <div class="metric-group">${group}</div>
        <h2>${title}</h2>
        <div class="metric-value">${snapshot.metrics[key]}%</div>
        <p>${description}</p>
        ${lens ? `
          <div class="metric-lens">
            <strong>${lens.mechanism}</strong>
            <p><span>Real-world signal:</span> ${lens.realWorldSignal}</p>
            <p><span>Does not prove:</span> ${lens.doesNotMean}</p>
            <p><span>Try next:</span> ${lens.nextAction}</p>
          </div>
        ` : ""}
        ${note}
      </article>
    `;
  }).join("");
}

function renderEvidence() {
  const cards = document.querySelector("#researchCards");
  const sources = document.querySelector("#researchSources");
  if (!cards || !sources) return;

  cards.innerHTML = Object.values(EVIDENCE_LENSES).map((lens) => `
    <article class="card evidence-card">
      <div class="metric-group">${lens.evidenceTag}</div>
      <h2>${lens.mechanism}</h2>
      <p>${lens.realWorldSignal}</p>
      <p><strong>Boundary:</strong> ${lens.doesNotMean}</p>
    </article>
  `).join("");

  sources.innerHTML = RESEARCH_SOURCES.map((source) => `
    <li>
      <a href="${source.url}" target="_blank" rel="noreferrer">${source.name}</a>
      <span>${source.use}</span>
    </li>
  `).join("");
}

function renderMeasurement() {
  const measurementGrid = document.querySelector("#measurementGrid");
  const promptRules = document.querySelector("#promptRules");
  if (!measurementGrid || !promptRules) return;

  measurementGrid.innerHTML = metricCopy.map(([, key, title]) => {
    const model = MEASUREMENT_MODEL[key];
    const rows = [
      ["What raises this metric", model.numerator],
      ["What it is measured against", model.denominator],
      ["When it updates", model.whenMeasured],
      ["What triggers the event", model.eventTrigger],
      ["Privacy boundary", model.privacyBoundary],
      ["What it cannot tell you", model.limitation]
    ];
    return `
      <article class="card measurement-card">
        <h2>${title}</h2>
        <p class="measurement-formula">
          <span>Rate logic</span>
          completed learning action / relevant opportunity
        </p>
        <dl class="measurement-list">
          ${rows.map(([label, value]) => `
            <div>
              <dt>${label}</dt>
              <dd>${formatMeasurementValue(value)}</dd>
            </div>
          `).join("")}
        </dl>
      </article>
    `;
  }).join("");

  promptRules.innerHTML = PROMPTING_MODEL.map((rule) => `
    <article class="card prompt-rule-card">
      <div class="metric-group">${rule.decisionPoint}</div>
      <h2>${rule.intervention}</h2>
      <p><strong>Trigger:</strong> ${rule.trigger}</p>
      <p><strong>Why:</strong> ${rule.reason}</p>
      <p><strong>Burden rule:</strong> ${rule.burdenRule}</p>
    </article>
  `).join("");
}

function formatMeasurementValue(value) {
  return String(value)
    .replace(/\b[a-z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)+\b/g, "<code>$&</code>");
}

function renderTrend() {
  const rows = snapshot.dailySeries;
  const width = 820;
  const height = 180;
  const pad = 26;
  const series = [
    ["attemptRate", "#225c53", "Attempt"],
    ["compareRate", "#3e6f98", "Compare"],
    ["reflectionRate", "#6f4e8b", "Reflection"],
    ["verificationActivity", "#b46b2a", "Verification"]
  ];
  const points = (key) => rows.map((row, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(rows.length - 1, 1);
    const y = height - pad - ((row[key] || 0) / 100) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  document.querySelector("#trendChart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" aria-hidden="true">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#d8e0e3" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#d8e0e3" />
      ${series.map(([key, color]) => `<polyline points="${points(key)}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`).join("")}
    </svg>
    <div class="legend">${series.map(([, color, label]) => `<span><i style="background:${color}"></i>${label}</span>`).join("")}</div>
  `;
}

function renderEvents() {
  const events = (snapshot.state.events || []).slice(-16).reverse();
  document.querySelector("#eventTimeline").innerHTML = events.length
    ? events.map((event) => `
      <div class="event-row">
        <span>${new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <strong>${event.type}</strong>
      </div>
    `).join("")
    : "<p class='fineprint'>No local behavior events yet.</p>";
}

function renderPrivacy() {
  const rows = [
    ["Prompts stored", snapshot.privacy.promptsStored],
    ["AI responses stored", snapshot.privacy.aiResponsesStored],
    ["Attempt text stored", snapshot.privacy.attemptTextStored],
    ["Reflection text stored", snapshot.privacy.reflectionTextStored],
    ["Screenshots stored", snapshot.privacy.screenshotsStored],
    ["Clipboard contents stored", snapshot.privacy.clipboardContentsStored],
    ["External ThinkFirst analytics requests", snapshot.privacy.externalAnalyticsRequests],
    ["Local behavior events", snapshot.privacy.localBehaviorEvents]
  ];
  document.querySelector("#privacyRows").innerHTML = rows
    .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
    .join("");
}

function selectTab(id) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.tab === id));
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== id);
  });
}

function toggleLocalData() {
  const pre = document.querySelector("#localData");
  pre.classList.toggle("hidden");
  pre.textContent = JSON.stringify({
    stats: snapshot.state.stats,
    daily: snapshot.state.daily,
    sessions: snapshot.state.sessions,
    events: snapshot.state.events
  }, null, 2);
}

async function exportAggregates() {
  const response = await send({ type: "EXPORT_AGGREGATES" });
  const blob = new Blob([JSON.stringify(response.export, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `thinkfirst-aggregates-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function deleteData() {
  if (!confirm("Delete all locally stored ThinkFirst data, including the local pilot survey? Settings will stay in place.")) return;
  await send({ type: "CLEAR_DATA" });
  localStorage.removeItem("tf_pilot_survey_local");
  document.querySelector("#pilotForm").reset();
  document.querySelector("#pilotStatus").textContent = "All local ThinkFirst data deleted.";
  snapshot = await send({ type: "GET_SNAPSHOT" });
  render();
}

function savePilot(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  localStorage.setItem("tf_pilot_survey_local", JSON.stringify(data));
  document.querySelector("#pilotStatus").textContent = "Saved locally on this device.";
}

function restorePilot() {
  const stored = JSON.parse(localStorage.getItem("tf_pilot_survey_local") || "{}");
  Object.entries(stored).forEach(([name, value]) => {
    const field = document.querySelector(`[name="${CSS.escape(name)}"]`);
    if (field) field.value = value;
  });
}

function clearPilot() {
  localStorage.removeItem("tf_pilot_survey_local");
  document.querySelector("#pilotForm").reset();
  document.querySelector("#pilotStatus").textContent = "Survey cleared.";
}

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || { ok: false }));
  });
}
