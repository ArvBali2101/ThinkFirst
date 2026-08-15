const screens = [
  {
    title: "What are you trying to do?",
    body: "ThinkFirst adapts the learning layer to your intention.",
    chooseMode: true,
    button: "Continue"
  },
  {
    title: "Think with AI, not instead of thinking.",
    body: "ThinkFirst preserves four human responsibilities while you use AI: Generate, Evaluate, Verify, Reflect.",
    button: "Continue"
  },
  {
    title: "Your conversations are not our data.",
    body: "ThinkFirst stores only small interaction events locally on your device.",
    facts: [
      ["Prompts stored", "0"],
      ["AI responses stored", "0"],
      ["Reflection text stored", "0"],
      ["Cloud analytics", "0"]
    ],
    button: "Finish setup"
  }
];

let index = 0;
let selectedMode = "quick";
render();
document.querySelector("#begin")?.addEventListener("click", () => document.querySelector("#doorway")?.scrollIntoView({ behavior: "smooth" }));
document.querySelector("#sessionTop")?.addEventListener("click", () => document.querySelector("#doorway")?.scrollIntoView({ behavior: "smooth" }));

function render() {
  const screen = screens[index];
  const root = document.querySelector("#screen");
  if (screen.chooseMode) {
    root.innerHTML = `
      ${renderModeChoices()}
      <div class="studio-actions">
        <button id="next" class="studio-primary" type="button">${screen.button}<span>→</span></button>
      </div>
    `;
  } else {
    root.innerHTML = `
      <section class="studio-setup-card">
        <div class="studio-section-label">${index === 1 ? "The loop" : "Privacy proof"}</div>
        <h2>${screen.title}</h2>
        <p>${screen.body}</p>
        ${screen.facts ? renderFacts(screen.facts) : renderFramework()}
        <div class="studio-actions">
          <button id="next" class="studio-primary" type="button">${screen.button}<span>→</span></button>
        </div>
      </section>
    `;
  }
  if (screen.chooseMode) {
    root.querySelectorAll("input[name='mode']").forEach((input) => {
      input.addEventListener("change", () => {
        selectedMode = input.value;
      });
    });
  }
  root.querySelector("#next").addEventListener("click", next);
}

async function next() {
  if (index < screens.length - 1) {
    index += 1;
    render();
    return;
  }
  await send({
    type: "UPDATE_SETTINGS",
    patch: {
      onboardingCompleted: true,
      mode: selectedMode
    }
  });
  await send({ type: "OPEN_DASHBOARD" });
}

function renderFacts(facts) {
  return `
    <table class="privacy-table">
      <tbody>
        ${facts.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderFramework() {
  return `
    <div class="studio-framework">
      <span>Generate</span>
      <span>Evaluate</span>
      <span>Verify</span>
      <span>Reflect</span>
    </div>
  `;
}

function renderModeChoices() {
  return `
    <div class="choice-cards studio-choice-cards">
      <label class="choice-card">
        <input type="radio" name="mode" value="quick" checked>
        <small>⚡ Doorway 01</small>
        <strong>Quick</strong>
        <span class="muted">I need an answer efficiently.</span>
      </label>
      <label class="choice-card">
        <input type="radio" name="mode" value="learn">
        <small>✎ Doorway 02</small>
        <strong>Learn</strong>
        <span class="muted">I want to understand this well enough to do it myself.</span>
      </label>
      <label class="choice-card">
        <input type="radio" name="mode" value="research">
        <small>⌕ Doorway 03</small>
        <strong>Research</strong>
        <span class="muted">I am investigating factual information.</span>
      </label>
      <label class="choice-card">
        <input type="radio" name="mode" value="create">
        <small>✣ Doorway 04</small>
        <strong>Create</strong>
        <span class="muted">I am writing, designing, or brainstorming.</span>
      </label>
      <label class="choice-card">
        <input type="radio" name="mode" value="school">
        <small>□ Doorway 05</small>
        <strong>School</strong>
        <span class="muted">I am preparing for an exam or assignment.</span>
      </label>
    </div>
  `;
}

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || { ok: false }));
  });
}
