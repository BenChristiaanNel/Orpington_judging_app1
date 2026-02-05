// ===================== ADMIN SYNC SETTINGS =====================
const ADMIN_URL = "https://script.google.com/macros/s/AKfycbyosFuaJ865q9Jy4qeVwo00MTC5XMsS_reV9MRnS-6G4fgct1AByOq6XlCPZwcXYFLa/exec";
const ADMIN_PASSCODE = "AVIOMED2026".trim(); // MUST match EXPECTED_PASSCODE in Code.gs

// ===================== MODE: JUDGE vs ADMIN =====================
const MODE_KEY = "appMode"; // "judge" | "admin"

function setMode(mode) {
  localStorage.setItem(MODE_KEY, mode);
  applyModeVisibility();
}

function getMode() {
  return localStorage.getItem(MODE_KEY) || "judge";
}

function isAdminMode() {
  return getMode() === "admin";
}

// Show/hide admin UI safely (no layout breaks)
function applyModeVisibility() {
  const winners = document.getElementById("adminWinnersSection");
  const exports = document.getElementById("adminExportSection");
  const backBtn = document.getElementById("backToJudgingBtn");

  // These IDs exist only on results screen; ignore if not present
  if (!winners || !exports || !backBtn) return;

  if (isAdminMode()) {
    winners.style.display = "block";
    exports.style.display = "block";
    backBtn.style.display = "none"; // admin shouldn’t go judge
  } else {
    winners.style.display = "none"; // judges don’t see winners
    exports.style.display = "none"; // judges don’t export
    backBtn.style.display = "inline-block";
  }
}


// ===================== SCREEN CONTROL =====================
function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "auto";
}

function showOnly(screenId) {
  const ids = [
    "introScreen", "showScreen", "judgeScreen", "classScreen", "colourScreen",
    "judgingScreen", "resultsScreen",
    "bestClassPage", "bestVarietyPage", "bestBreedPage"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const isMainScroll = (id === "judgingScreen" || id === "resultsScreen" || id === "bestClassPage" || id === "bestVarietyPage" || id === "bestBreedPage");
    el.style.display = (id === screenId) ? (isMainScroll ? "block" : "flex") : "none";
  });

  lockScroll(!(screenId === "judgingScreen" || screenId === "resultsScreen" || screenId === "bestClassPage" || screenId === "bestVarietyPage" || screenId === "bestBreedPage"));
}

window.addEventListener("load", () => {
  showOnly("introScreen");
  lockScroll(true);

  if (navigator.onLine) {
    try { syncPending(); } catch(e) {}
  }
});

window.addEventListener("online", () => {
  try { syncPending(); } catch(e) {}
});

// ===================== DEVICE + SYNC QUEUE =====================
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dev_" + Math.random().toString(16).slice(2) + "_" + Date.now();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function queueForSync(entry) {
  const pending = JSON.parse(localStorage.getItem("pendingSync") || "[]");
  pending.push(entry);
  localStorage.setItem("pendingSync", JSON.stringify(pending));
}

/**
 * Upload (no CORS problems):
 * Uses navigator.sendBeacon to POST data to Apps Script web app.
 */
function sendEntriesToAdmin(entries) {
  if (!ADMIN_URL) throw new Error("ADMIN_URL not set");

  const payload = { passcode: ADMIN_PASSCODE, entries };
  const blob = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=utf-8" });

  const ok = navigator.sendBeacon(ADMIN_URL, blob);
  if (!ok) throw new Error("sendBeacon failed");

  return { ok: true, inserted: entries.length };
}

function syncPending() {
  const pending = JSON.parse(localStorage.getItem("pendingSync") || "[]");
  if (pending.length === 0) return { ok: true, inserted: 0 };

  sendEntriesToAdmin(pending);
  localStorage.removeItem("pendingSync");
  return { ok: true, inserted: pending.length };
}

function syncNow() {
  if (!navigator.onLine) {
    alert("No internet right now. Birds are saved and will sync later.");
    return;
  }
  try {
    const r = syncPending();
    alert("Synced pending birds: " + (r.inserted || 0));
  } catch (e) {
    alert("Sync failed. Try again when signal is stronger.");
  }
}

// ===================== COLOUR LABELS =====================
const COLOUR_LABELS = {
  BLACK: "Black",
  BLUE: "Blue",
  BUFF: "Buff",
  WHITE: "White",
  SPLASH: "Splash",
  CHOCOLATE: "Chocolate",
  LAVENDER: "Lavender",
  JUBILEE: "Jubilee",
  CUCKOO: "Cuckoo",
  PARTRIDGE: "Partridge",
  SILVER_LACED: "Silver Laced",
  GOLD_LACED: "Gold Laced",
  RED: "Red",
  ISABEL: "Isabel",
  CRELE: "Crele"
};

function saGroupForColour(colourKey) {
  if (colourKey === "BLACK") return "SA_BLACK";
  if (colourKey === "BLUE" || colourKey === "LAVENDER") return "SA_BLUE_LAV";
  return "SA_BUFF_WHITE_OTHER";
}

// ===================== SA TEMPLATES (100 POINTS) =====================
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

// ===================== DISQUALIFICATION LISTS =====================
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

// ===================== FLOW =====================
function startApp() {
  ADMIN_FLOW = false;
  setMode("judge");
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
  const lbl = document.getElementById("showNameDisplay");
  if (lbl) lbl.textContent = showName;

  showOnly("judgeScreen");

  const savedJudge = localStorage.getItem("currentJudge") || "";
  const j = document.getElementById("judgeName");
  if (j) j.value = savedJudge;
}

  // ✅ If admin flow: go straight to Results screen (no judge/class needed)
  if (ADMIN_FLOW || isAdminMode()) {
    document.getElementById("resultsShowName").textContent = showName || "-";
    document.getElementById("resultsJudgeName").textContent = "ADMIN";
    document.getElementById("resultsClassName").textContent = "ALL CLASSES";

    showOnly("resultsScreen");
    applyModeVisibility();

    const resultsDiv = document.getElementById("resultsPageContent");
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <p><strong>Admin Mode:</strong> Choose Winners pages or Export options above.</p>
        <p style="opacity:0.85;">(Judging is hidden in admin mode.)</p>
      `;
    }
    return;
  }


function saveJudgeAndContinue() {
  const j = document.getElementById("judgeName");
  const judgeName = (j ? j.value : "").trim();
  if (!judgeName) return alert("Please enter the judge name.");

  localStorage.setItem("currentJudge", judgeName);
  const lbl = document.getElementById("judgeNameDisplay");
  if (lbl) lbl.textContent = judgeName;

  showOnly("classScreen");

  const savedClass = localStorage.getItem("currentClass") || "";
  const cd = document.getElementById("classSelectedDisplay");
  if (cd) cd.textContent = savedClass || "None";
}

// Tap class = auto-next
function selectClass(className) {
  localStorage.setItem("currentClass", className);
  const cd = document.getElementById("classSelectedDisplay");
  if (cd) cd.textContent = className;

  setTimeout(() => {
    const cs = document.getElementById("classScreen");
    if (cs && cs.style.display !== "none") saveClassAndContinue();
  }, 120);
}

function saveClassAndContinue() {
  const className = localStorage.getItem("currentClass") || "";
  if (!className) return alert("Please select a class first.");

  const lbl = document.getElementById("classNameDisplay");
  if (lbl) lbl.textContent = className;

  showOnly("colourScreen");

  const savedColour = localStorage.getItem("currentColour") || "";
  const cd = document.getElementById("colourSelectedDisplay");
  if (cd) cd.textContent = savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

// Tap colour = auto-next
function selectColour(colourKey) {
  localStorage.setItem("currentColour", colourKey);
  const cd = document.getElementById("colourSelectedDisplay");
  if (cd) cd.textContent = COLOUR_LABELS[colourKey] || colourKey;

  setTimeout(() => {
    const cs = document.getElementById("colourScreen");
    if (cs && cs.style.display !== "none") saveColourAndContinue();
  }, 120);
}

function saveColourAndContinue() {
  const colourKey = localStorage.getItem("currentColour") || "";
  if (!colourKey) return alert("Please select a colour first.");

  const lbl = document.getElementById("colourNameDisplay");
  if (lbl) lbl.textContent = COLOUR_LABELS[colourKey] || colourKey;

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
  const cd = document.getElementById("classSelectedDisplay");
  if (cd) cd.textContent = savedClass || "None";
}

function backToColour() {
  showOnly("colourScreen");
  const savedColour = localStorage.getItem("currentColour") || "";
  const cd = document.getElementById("colourSelectedDisplay");
  if (cd) cd.textContent = savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

function backToJudgingFromResults() {
  showOnly("judgingScreen");
  lockScroll(false);
}

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
let ADMIN_FLOW = false;

function startAdmin() {
  ADMIN_FLOW = true;

  // Ask for passcode (same one you already use)
  const pass = prompt("Admin passcode:");
  if (!pass) return;

  if (pass.trim().toUpperCase() !== ADMIN_PASSCODE.trim().toUpperCase()) {
    alert("Wrong passcode.");
    return;
  }

  setMode("admin");
  showOnly("showScreen");

  // prefill show if saved
  const savedShow = localStorage.getItem("currentShow") || "";
  const sel = document.getElementById("showSelect");
  if (sel && savedShow) sel.value = savedShow;
}


// ===================== SCORING UX (stop jumping to Bird ID) =====================
function blurBirdId() {
  const idEl = document.getElementById("birdId");
  if (idEl && document.activeElement === idEl) idEl.blur();
}

// ===================== SCORING UI =====================
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
                 oninput="updateSliderValue(this)"
                 onpointerdown="blurBirdId()"
                 ontouchstart="blurBirdId()" />
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
  container.querySelectorAll(".score-slider").forEach(sl => total += Number(sl.value));
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

// ===================== DQ UI =====================
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

// ===================== SAVE / RESULTS / EXPORT =====================
function saveBird() {
  const birdId = document.getElementById("birdId")?.value.trim() || "";

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
  const total = isDQ ? 0 : Number(document.getElementById("total")?.textContent || "0");

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

  // Save locally
  const birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds.push(bird);
  localStorage.setItem("birds", JSON.stringify(birds));

  // Build admin entry
  const deviceId = getDeviceId();
  const entryKey = `${deviceId}|${bird.show}|${bird.judge}|${bird.class}|${bird.colour}|${bird.id}|${bird.timestamp}`;

  const syncEntry = {
    entry_key: entryKey,
    device_id: deviceId,
    show: bird.show,
    judge: bird.judge,
    class: bird.class,
    colour: bird.colour,
    bird_id: bird.id,
    disqualified: bird.disqualified,
    dq_reason: bird.dqReason,
    dq_note: bird.dqNote,
    total: bird.total,
    scores_json: JSON.stringify(bird.scores || {}),
    comment: bird.comment,
    timestamp: bird.timestamp
  };

  // Auto-send or queue
  if (navigator.onLine) {
    try {
      sendEntriesToAdmin([syncEntry]);
    } catch (e) {
      queueForSync(syncEntry);
    }
  } else {
    queueForSync(syncEntry);
  }

  alert("Bird saved!");
  prepareNextBird();
}

function showResults() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  document.getElementById("resultsShowName").textContent = showName || "-";
  document.getElementById("resultsJudgeName").textContent = judgeName || "-";
  document.getElementById("resultsClassName").textContent = className || "-";

  const resultsDiv = document.getElementById("resultsPageContent");
  if (!resultsDiv) return;

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet for this show/judge/class.</p>";
    showOnly("resultsScreen");
    return;
  }

  // group by colour
  const grouped = {};
  birds.forEach(b => {
    if (!grouped[b.colour]) grouped[b.colour] = [];
    grouped[b.colour].push(b);
  });

  let html = `
    <div style="margin-bottom:12px;">
      <button type="button" onclick="syncNow()"
        style="padding:12px 14px; border-radius:12px; border:1px solid #d1d5db; background:#fff; font-weight:900; cursor:pointer;">
        Sync Pending to Admin
      </button>
      <span style="margin-left:10px; font-weight:800; opacity:0.8;">
        (offline birds will upload when online)
      </span>
    </div>
  `;

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
    applyModeVisibility();

  showOnly("resultsScreen");
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

    csv += `"${b.show}","${b.judge}","${b.class}","${colourLabel}","${b.id}",${b.disqualified ? "YES":"NO"},"${dqReason}","${dqNote}",${b.total},"${scoresJson}","${comment}","${b.timestamp}"\n`;
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

// ============================================================
// ✅ ONLINE BEST-OF PAGES (JSONP — fixes Failed to fetch)
// ============================================================

function buildLeaderboardUrl(showName) {
  const qs = new URLSearchParams({
    mode: "leaderboard",
    show: showName,
    passcode: ADMIN_PASSCODE
  });
  return `${ADMIN_URL}?${qs.toString()}`;
}

function fetchJsonp(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    const script = document.createElement("script");

    const cleanup = () => {
      try { delete window[cb]; } catch(e) {}
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout"));
    }, timeoutMs);

    window[cb] = (data) => {
      clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Failed to fetch"));
    };

    const join = url.includes("?") ? "&" : "?";
    script.src = url + join + "callback=" + encodeURIComponent(cb);
    document.body.appendChild(script);
  });
}

async function fetchOnlineLeaderboardOrThrow() {
  const showName = localStorage.getItem("currentShow") || "";
  if (!showName) throw new Error("No show selected");
  if (!navigator.onLine) throw new Error("No internet");

  const url = buildLeaderboardUrl(showName);
  const data = await fetchJsonp(url);

  if (!data || data.ok !== true) {
    throw new Error(data?.error || "Unknown error");
  }
  return data;
}

function backToResultsFromBestPages() {
  showOnly("resultsScreen");
}

// Best in Class (Top 5 per class+colour)
async function openBestClassPage() {
  const container = document.getElementById("bestClassContent");
  if (container) container.innerHTML = "<p><em>Loading online results…</em></p>";
  showOnly("bestClassPage");

  try {
    const data = await fetchOnlineLeaderboardOrThrow();
    const list = data.results?.bestClassColour || [];
    if (list.length === 0) {
      container.innerHTML = "<p><strong>No ranked entries yet.</strong></p>";
      return;
    }

    let html = "";
    list.forEach(block => {
      const cls = block.class || "-";
      const col = block.colour || "-";
      const entries = block.entries ?? 0;

      html += `<h3 style="margin-top:14px;">${escapeHtml(cls)} — ${escapeHtml(col)} <span style="opacity:0.7;">(Entries: ${entries})</span></h3>`;

      const top5 = block.top5 || [];
      if (top5.length === 0) {
        html += `<p><em>No ranked birds.</em></p>`;
      } else {
        top5.forEach((b, idx) => {
          let style = "";
          if (idx === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
          else if (idx === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
          else if (idx === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;";

          html += `<p style="${style}">
            ${idx + 1}. Bird ${escapeHtml(b.bird_id)} — <strong>${escapeHtml(String(b.total))}</strong>
            <span style="opacity:0.8;">(Judge: ${escapeHtml(b.judge || "-")})</span>
          </p>`;
        });
      }

      html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
    });

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<p style="color:#b91c1c;"><strong>ONLINE RESULTS FAILED</strong></p>
      <p>Reason: ${escapeHtml((e && e.message) ? e.message : "unknown")}</p>`;
  }
}

// Best in Variety (Top 3 per colour)
async function openBestVarietyPage() {
  const container = document.getElementById("bestVarietyContent");
  if (container) container.innerHTML = "<p><em>Loading online results…</em></p>";
  showOnly("bestVarietyPage");

  try {
    const data = await fetchOnlineLeaderboardOrThrow();
    const list = data.results?.bestVariety || [];
    if (list.length === 0) {
      container.innerHTML = "<p><strong>No ranked entries yet.</strong></p>";
      return;
    }

    let html = "";
    list.forEach(block => {
      const col = block.colour || "-";
      const entries = block.entries ?? 0;
      const top3 = block.top3 || [];

      // One card per variety with top3 inside
      html += `
        <div class="winner-card" style="background:#ffffff;">
          <div class="winner-title">🎨 ${escapeHtml(col)} <span style="opacity:0.6; font-size:14px;">(Entries: ${entries})</span></div>
          ${top3.length === 0 ? `<p><em>No ranked birds.</em></p>` : `
            ${top3.map((b, idx) => {
              let style = "";
              if (idx === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:10px;display:block;";
              else if (idx === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:10px;display:block;";
              else if (idx === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:10px;display:block;";
              return `<p style="${style}">
                ${idx + 1}. Bird ${escapeHtml(b.bird_id)} — <strong>${escapeHtml(String(b.total))}</strong>
                <span style="opacity:0.85;">(Class: ${escapeHtml(b.class || "-")}, Judge: ${escapeHtml(b.judge || "-")})</span>
              </p>`;
            }).join("")}
          `}
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<p style="color:#b91c1c;"><strong>ONLINE RESULTS FAILED</strong></p>
      <p>Reason: ${escapeHtml((e && e.message) ? e.message : "unknown")}</p>`;
  }
}

// Best in Breed (two cards, judge from SHEET per bird)
async function openBestInBreedPage() {
  const container = document.getElementById("bestBreedContent");
  if (container) container.innerHTML = "<p><em>Loading online results…</em></p>";
  showOnly("bestBreedPage");

  try {
    const data = await fetchOnlineLeaderboardOrThrow();

    const showName = localStorage.getItem("currentShow") || "-";
    const bib = data.results?.bestInBreed || {};
    const winner = bib.winner || null;
    const reserve = bib.reserve || null;

    if (!winner) {
      container.innerHTML = `<p><strong>Total ranked entries:</strong> ${bib.entries ?? 0}</p>
        <p><em>No winner yet.</em></p>`;
      return;
    }

    function cardHtml(title, b, bg) {
      if (!b) return "";
      return `
        <div class="winner-card" style="background:${bg};">
          <div class="winner-title">${title}</div>
          <div class="winner-grid">
            <div class="kv"><b>Show:</b> ${escapeHtml(showName)}</div>
            <div class="kv"><b>Judge:</b> ${escapeHtml(b.judge || "-")}</div>
            <div class="kv"><b>Class:</b> ${escapeHtml(b.class || "-")}</div>
            <div class="kv"><b>Colour:</b> ${escapeHtml(b.colour || "-")}</div>
            <div class="kv"><b>Bird ID:</b> ${escapeHtml(b.bird_id || "-")}</div>
            <div class="kv"><b>Total:</b> ${escapeHtml(String(b.total ?? 0))}</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <p style="margin-top:0;"><strong>Total ranked entries:</strong> ${bib.entries ?? 0}</p>
      ${cardHtml("🏆 Best in Breed (Winner)", winner, "#fff7cc")}
      ${reserve ? cardHtml("🥈 Reserve Best in Breed", reserve, "#f3f4f6") : "<p><em>No reserve yet.</em></p>"}
    `;
  } catch (e) {
    container.innerHTML = `<p style="color:#b91c1c;"><strong>ONLINE RESULTS FAILED</strong></p>
      <p>Reason: ${escapeHtml((e && e.message) ? e.message : "unknown")}</p>`;
  }
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// ============================================================
// ✅ EXPORT BUTTONS (NO FETCH — opens URL to download CSV)
// ============================================================

function buildExportUrl(showName, mode) {
  const qs = new URLSearchParams({
    mode,
    show: showName,
    passcode: ADMIN_PASSCODE
  });
  return `${ADMIN_URL}?${qs.toString()}`;
}

function exportWinnersOnline() {
  if (!navigator.onLine) {
    alert("No internet right now. Please connect to export winners.");
    return;
  }

  const showName = (localStorage.getItem("currentShow") || "").trim();
  if (!showName) {
    alert("No show selected.");
    return;
  }

  // Opens a CSV that Excel can open
  const url = buildExportUrl(showName, "export_winners");
  window.open(url, "_blank");
}

function exportAllOnline() {
  if (!navigator.onLine) {
    alert("No internet right now. Please connect to export all results.");
    return;
  }

  const showName = (localStorage.getItem("currentShow") || "").trim();
  if (!showName) {
    alert("No show selected.");
    return;
  }

  // Exports ALL rows for the show (without timestamp/device_id/entry_key)
  const url = buildExportUrl(showName, "export_all");
  window.open(url, "_blank");
}

/* =========================
   HOME MODE BUTTON FIX
========================= */

function startJudgeMode(){
  startApp();   // reuse your existing working function
}

function openAdmin(){
  // go straight to results/admin screen
  hideAllScreens();
  document.getElementById("resultsScreen").style.display = "block";
}

function hideAllScreens(){
  const screens = [
    "introScreen",
    "showScreen",
    "judgeScreen",
    "classScreen",
    "colourScreen",
    "judgingScreen",
    "resultsScreen",
    "bestClassPage",
    "bestVarietyPage",
    "bestBreedPage"
  ];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}
// ✅ Force functions to be callable by onclick="..."
window.startJudgeMode = window.startJudgeMode || function () {
  if (typeof startApp === "function") startApp();
};

window.openAdmin = window.openAdmin || function () {
  if (typeof showOnly === "function") {
    showOnly("resultsScreen");
    lockScroll(false);
    return;
  }

  // fallback if showOnly doesn't exist
  const ids = [
    "introScreen","showScreen","judgeScreen","classScreen","colourScreen",
    "judgingScreen","resultsScreen","bestClassPage","bestVarietyPage","bestBreedPage"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === "resultsScreen") ? "block" : "none";
  });
};
