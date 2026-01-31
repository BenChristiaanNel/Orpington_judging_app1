// ----------------- HELPERS -----------------
function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "auto";
}

function showOnly(screenId) {
  const ids = [
    "introScreen", "showScreen", "judgeScreen", "classScreen", "colourScreen",
    "judgingScreen", "resultsScreen"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id === screenId) {
      el.style.display = (id === "judgingScreen" || id === "resultsScreen") ? "block" : "flex";
    } else {
      el.style.display = "none";
    }
  });

  lockScroll(!(screenId === "judgingScreen" || screenId === "resultsScreen"));
}

window.addEventListener("load", () => {
  showOnly("introScreen");
  lockScroll(true);
});

// ----------------- COLOURS -----------------
const COLOUR_LABELS = {
  BLACK:"Black", BLUE:"Blue", BUFF:"Buff", WHITE:"White", SPLASH:"Splash",
  CHOCOLATE:"Chocolate", LAVENDER:"Lavender", JUBILEE:"Jubilee",
  CUCKOO:"Cuckoo", PARTRIDGE:"Partridge", SILVER_LACED:"Silver Laced", GOLD_LACED:"Gold Laced",
  RED:"Red", ISABEL:"Isabel", CRELE:"Crele"
};

function saGroupForColour(colourKey) {
  if (colourKey === "BLACK") return "SA_BLACK";
  if (colourKey === "BLUE" || colourKey === "LAVENDER") return "SA_BLUE_LAV";
  return "SA_BUFF_WHITE_OTHER";
}

// ----------------- SA TEMPLATES -----------------
const TEMPLATES = {
  SA_BLACK: {
    name: "THE BLACK (SA) — Total 100",
    criteria: [
      { key:"type", label:"Type", max:30, help:"(body 15, breast 10, saddle 5)" },
      { key:"size", label:"Size", max:10, help:"" },
      { key:"carriage", label:"Carriage", max:10, help:"" },
      { key:"head", label:"Head", max:25, help:"(skull 5, comb 7, face 5, eyes 5, beak 3)" },
      { key:"skin", label:"Skin", max:5, help:"" },
      { key:"legs", label:"Legs and feet", max:5, help:"" },
      { key:"plumage_condition", label:"Plumage and condition", max:10, help:"" },
      { key:"tail", label:"Tail", max:5, help:"" }
    ]
  },

  SA_BLUE_LAV: {
    name: "THE BLUE AND LAVENDER (SA) — Total 100",
    criteria: [
      { key:"type", label:"Type", max:25, help:"" },
      { key:"size", label:"Size (with utility qualities)", max:20, help:"" },
      { key:"head", label:"Head", max:10, help:"" },
      { key:"legs", label:"Legs and feet", max:10, help:"" },
      { key:"colour_plumage", label:"Colour and plumage", max:25, help:"" },
      { key:"condition", label:"Condition", max:10, help:"" }
    ]
  },

  SA_BUFF_WHITE_OTHER: {
    name: "THE BUFF, WHITE AND OTHER COLOURS (SA) — Total 100",
    criteria: [
      { key:"type", label:"Type", max:30, help:"" },
      { key:"size", label:"Size", max:10, help:"" },
      { key:"head", label:"Head", max:15, help:"" },
      { key:"legs", label:"Legs and feet", max:10, help:"" },
      { key:"colour_plumage", label:"Colour and plumage", max:20, help:"" },
      { key:"condition", label:"Condition", max:15, help:"" }
    ]
  }
};

// ----------------- DISQUALIFICATIONS -----------------
const DQ_GENERAL = [
  "Side spikes on comb",
  "White in ear-lobes",
  "Feather or fluff on shanks or feet",
  "Long legs",
  "Any deformity",
  "Yellow skin, yellow beak and yellow on the shanks or feet",
  "Any yellow or sappiness in the white",
  "Coarseness in head, legs or feathers of the buff",
  "Any trimming or faking"
];

const DQ_BY_COLOUR = {
  BLACK: [
    "More than one spot (~12mm) of positive white in any part of plumage",
    "Two or more feathers tipped/edged with positive white",
    "Light coloured beak and eyes",
    "Leg colour other than dark slate"
  ],
  BLUE: [
    "Red, yellow or positive white in plumage",
    "Light coloured beak and eyes",
    "Leg colour other than black or blue"
  ],
  BUFF: [
    "Blue shanks",
    "Coarseness in face"
  ],
  WHITE: [
    "Blue shanks"
  ],
  SPLASH: [
    "Feathers not to be more than 50% black (Splash Black rule)",
    "Feathers not to be more than 50% blue (Splash Blue rule)",
    "Any appearance of rust in plumage"
  ]
};

function populateDQReasons(colourKey) {
  const sel = document.getElementById("dqReason");
  if (!sel) return;

  const list = [
    ...DQ_GENERAL.map(x => `GENERAL: ${x}`),
    ...(DQ_BY_COLOUR[colourKey] ? DQ_BY_COLOUR[colourKey].map(x => `COLOUR: ${x}`) : [])
  ];

  sel.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "-- Select reason --";
  sel.appendChild(first);

  list.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    sel.appendChild(opt);
  });
}

// ----------------- FLOW -----------------
function startApp() {
  showOnly("showScreen");

  const savedShow = localStorage.getItem("currentShow") || "";
  const sel = document.getElementById("showSelect");
  if (sel && savedShow) sel.value = savedShow;
}

function saveShowAndContinue() {
  const sel = document.getElementById("showSelect");
  const showName = (sel ? sel.value : "").trim();
  if (!showName) return alert("Please choose a show.");

  localStorage.setItem("currentShow", showName);
  document.getElementById("showNameDisplay").textContent = showName;

  showOnly("judgeScreen");

  const savedJudge = localStorage.getItem("currentJudge") || "";
  const j = document.getElementById("judgeName");
  if (j) j.value = savedJudge;
}

function saveJudgeAndContinue() {
  const j = document.getElementById("judgeName");
  const judgeName = (j ? j.value : "").trim();
  if (!judgeName) return alert("Please enter the judge name.");

  localStorage.setItem("currentJudge", judgeName);
  document.getElementById("judgeNameDisplay").textContent = judgeName;

  showOnly("classScreen");

  const savedClass = localStorage.getItem("currentClass") || "";
  document.getElementById("classSelectedDisplay").textContent = savedClass || "None";
}

function selectClass(className) {
  localStorage.setItem("currentClass", className);
  document.getElementById("classSelectedDisplay").textContent = className;
}

function saveClassAndContinue() {
  const className = localStorage.getItem("currentClass") || "";
  if (!className) return alert("Please select a class first.");

  document.getElementById("classNameDisplay").textContent = className;

  showOnly("colourScreen");

  const savedColour = localStorage.getItem("currentColour") || "";
  document.getElementById("colourSelectedDisplay").textContent =
    savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

// ✅ Tap colour = auto-continue
function selectColour(colourKey) {
  localStorage.setItem("currentColour", colourKey);

  const disp = document.getElementById("colourSelectedDisplay");
  if (disp) disp.textContent = COLOUR_LABELS[colourKey] || colourKey;

  // small delay so text updates before switching
  setTimeout(() => {
    const colourScreen = document.getElementById("colourScreen");
    if (colourScreen && colourScreen.style.display !== "none") {
      saveColourAndContinue();
    }
  }, 120);
}

function saveColourAndContinue() {
  const colourKey = localStorage.getItem("currentColour") || "";
  if (!colourKey) return alert("Please select a colour first.");

  document.getElementById("colourNameDisplay").textContent = COLOUR_LABELS[colourKey] || colourKey;

  renderTemplateForColour(colourKey);
  resetDQUI();
  populateDQReasons(colourKey);

  showOnly("judgingScreen");
  lockScroll(false);
  calculateTotal();

  const birdIdInput = document.getElementById("birdId");
  if (birdIdInput) birdIdInput.focus();
}

// Back buttons
function backToClass() {
  showOnly("classScreen");
  const savedClass = localStorage.getItem("currentClass") || "";
  document.getElementById("classSelectedDisplay").textContent = savedClass || "None";
}

function backToColour() {
  showOnly("colourScreen");
  const savedColour = localStorage.getItem("currentColour") || "";
  document.getElementById("colourSelectedDisplay").textContent =
    savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

function backToJudgingFromResults() {
  showOnly("judgingScreen");
  lockScroll(false);
}

// New show button from results screen
function newShowHome() {
  const fullReset = confirm(
    "Start a new show?\n\nOK = Clear ALL saved birds on this device.\nCancel = Keep saved birds but go back to Home."
  );

  if (fullReset) localStorage.removeItem("birds");

  localStorage.removeItem("currentClass");
  localStorage.removeItem("currentColour");

  showOnly("introScreen");
  lockScroll(true);
}

// ----------------- SCORING UI -----------------
function renderTemplateForColour(colourKey) {
  const groupKey = saGroupForColour(colourKey);
  const template = TEMPLATES[groupKey];

  const container = document.getElementById("scoringContainer");
  const tName = document.getElementById("templateName");
  if (!container || !tName) return;

  tName.textContent = template ? template.name : "No template found";
  if (!template) { container.innerHTML = ""; return; }

  let html = "";
  template.criteria.forEach(c => {
    html += `
      <div class="score-row">
        <label>${c.label} <span style="font-weight:700; opacity:0.75;">(0–${c.max})</span></label>
        ${c.help ? `<div class="score-help">${c.help}</div>` : ""}
        <div class="score-line">
          <input type="range"
                 min="0"
                 max="${c.max}"
                 value="0"
                 class="score-slider"
                 data-crit-key="${c.key}"
                 oninput="updateSliderValue(this)" />
          <span class="score-badge">0</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  calculateTotal();
}

function updateSliderValue(slider) {
  const badge = slider.parentElement ? slider.parentElement.querySelector(".score-badge") : null;
  if (badge) badge.textContent = slider.value;
  calculateTotal();
}

function calculateTotal() {
  const totalDisplay = document.getElementById("total");
  const container = document.getElementById("scoringContainer");
  const dqToggle = document.getElementById("dqToggle");

  if (!totalDisplay || !container) return;

  if (dqToggle && dqToggle.checked) {
    totalDisplay.textContent = "0";
    return;
  }

  let total = 0;
  container.querySelectorAll(".score-slider").forEach(sl => {
    total += Number(sl.value);
  });
  totalDisplay.textContent = String(total);
}

function getScoresObject() {
  const container = document.getElementById("scoringContainer");
  const colourKey = localStorage.getItem("currentColour") || "";
  const groupKey = saGroupForColour(colourKey);
  const template = TEMPLATES[groupKey];
  const scores = {};

  if (!container || !template) return scores;

  template.criteria.forEach(c => {
    const el = container.querySelector(`[data-crit-key="${c.key}"]`);
    scores[c.key] = el ? Number(el.value) : 0;
  });

  return scores;
}

// Auto next bird reset
function prepareNextBird() {
  const container = document.getElementById("scoringContainer");
  if (container) {
    container.querySelectorAll(".score-slider").forEach(sl => {
      sl.value = 0;
      const badge = sl.parentElement ? sl.parentElement.querySelector(".score-badge") : null;
      if (badge) badge.textContent = "0";
    });
  }

  const c = document.getElementById("commentBox");
  if (c) c.value = "";

  resetDQUI();
  calculateTotal();

  const birdIdInput = document.getElementById("birdId");
  if (birdIdInput) {
    birdIdInput.value = "";
    birdIdInput.focus();
  }
}

// ----------------- DQ UI -----------------
function resetDQUI() {
  const toggle = document.getElementById("dqToggle");
  const fields = document.getElementById("dqFields");
  const reason = document.getElementById("dqReason");
  const note = document.getElementById("dqNote");

  if (toggle) toggle.checked = false;
  if (fields) fields.style.display = "none";
  if (reason) reason.value = "";
  if (note) note.value = "";
}

function toggleDQ() {
  const toggle = document.getElementById("dqToggle");
  const fields = document.getElementById("dqFields");
  if (!toggle || !fields) return;

  fields.style.display = toggle.checked ? "block" : "none";
  calculateTotal();
}

function quickDQ() {
  const toggle = document.getElementById("dqToggle");
  if (toggle && !toggle.checked) {
    toggle.checked = true;
    toggleDQ();
  }
  const reason = document.getElementById("dqReason");
  if (reason) reason.focus();
}

// ----------------- SAVE / RESULTS / EXPORT -----------------
function saveBird() {
  const birdId = document.getElementById("birdId").value.trim();

  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";
  const colourKey = localStorage.getItem("currentColour") || "";

  if (!showName || !judgeName || !className || !colourKey) {
    alert("Please select show, judge, class, and colour first.");
    return;
  }
  if (!birdId) {
    alert("Please enter Bird ID");
    return;
  }

  const isDQ = document.getElementById("dqToggle")?.checked || false;
  const dqReason = (document.getElementById("dqReason")?.value || "").trim();
  const dqNote = (document.getElementById("dqNote")?.value || "").trim();

  if (isDQ && !dqReason) {
    alert("If Disqualified is selected, please choose a DQ reason.");
    return;
  }

  const comment = (document.getElementById("commentBox")?.value || "").trim();
  const scores = getScoresObject();
  const total = isDQ ? 0 : Number(document.getElementById("total").textContent || "0");

  const bird = {
    show: showName,
    judge: judgeName,
    class: className,
    colour: colourKey,
    id: birdId,
    total,
    scores,
    disqualified: isDQ,
    dqReason,
    dqNote,
    comment,
    timestamp: new Date().toISOString()
  };

  const birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds.push(bird);
  localStorage.setItem("birds", JSON.stringify(birds));

  alert("Bird saved!");
  prepareNextBird();
}

function showResults() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  // Header labels on results screen
  const rs = document.getElementById("resultsShowName");
  const rj = document.getElementById("resultsJudgeName");
  const rc = document.getElementById("resultsClassName");
  if (rs) rs.textContent = showName || "-";
  if (rj) rj.textContent = judgeName || "-";
  if (rc) rc.textContent = className || "-";

  const resultsDiv = document.getElementById("resultsPageContent");
  if (!resultsDiv) return;

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet for this show/judge/class.</p>";
    showOnly("resultsScreen");
    return;
  }

  // Group by colour
  const grouped = {};
  birds.forEach(b => {
    if (!grouped[b.colour]) grouped[b.colour] = [];
    grouped[b.colour].push(b);
  });

  let html = "";

  Object.keys(grouped).forEach(colKey => {
    const label = COLOUR_LABELS[colKey] || colKey;

    const all = grouped[colKey];
    const ranked = all.filter(x => !x.disqualified).sort((a, b) => Number(b.total) - Number(a.total));
    const dq = all.filter(x => x.disqualified);

    html += `<h3>${label} (Total entries: ${all.length})</h3>`;

    if (ranked.length === 0) {
      html += `<p><em>No ranked birds (all disqualified).</em></p>`;
    } else {
      ranked.forEach((bird, index) => {
        let style = "";
        if (index === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
        else if (index === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
        else if (index === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;";

        html += `<p style="${style}">${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong></p>`;
      });
    }

    if (dq.length > 0) {
      html += `<p style="margin-top:10px; font-weight:900;">Disqualified:</p>`;
      dq.forEach(b => {
        const reason = (b.dqReason || "No reason").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        html += `<p style="padding:6px 0; opacity:0.95;"><strong>Bird ${b.id}</strong> — <em>${reason}</em></p>`;
      });
    }

    html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
  });

  resultsDiv.innerHTML = html;
  showOnly("resultsScreen");
}

function resetShow() {
  if (confirm("Start a new show? This will delete ALL saved birds on this device.")) {
    localStorage.removeItem("birds");
    alert("New show started.");
  }
}

function exportCSV() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  if (birds.length === 0) {
    alert("No data to export for this show/judge/class.");
    return;
  }

  let csv = "Show,Judge,Class,Colour,Bird ID,Disqualified,DQ Reason,DQ Note,Total,ScoresJSON,Comment,Timestamp\n";

  birds.forEach(b => {
    const colourLabel = COLOUR_LABELS[b.colour] || b.colour;
    const scoresJson = JSON.stringify(b.scores || {}).replace(/"/g, '""');
    const comment = (b.comment || "").replace(/"/g, '""');
    const dqReason = (b.dqReason || "").replace(/"/g, '""');
    const dqNote = (b.dqNote || "").replace(/"/g, '""');

    csv += `"${b.show}","${b.judge}","${b.class}","${colourLabel}","${b.id}",${b.disqualified ? "YES":"NO"},"${dqReason}","${dqNote}",${b.total},"${scoresJson}","${comment}",${b.timestamp}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const safeShow = showName.replace(/[^a-z0-9]+/gi, "_");
  const safeJudge = judgeName.replace(/[^a-z0-9]+/gi, "_");
  const safeClass = className.replace(/[^a-z0-9]+/gi, "_");

  const a = document.createElement("a");
  a.href = url;
  a.download = `orpington_results_${safeShow}_${safeJudge}_${safeClass}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

