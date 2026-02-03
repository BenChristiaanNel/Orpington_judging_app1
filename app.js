// ===================== ADMIN SYNC SETTINGS =====================
const ADMIN_URL = "https://script.google.com/macros/s/AKfycbxN44zh57LIM2SebCG6yffJF02sWWOhavfllBQzHc1y8ScyeGc6YjIJqxSZAdVIg7DT/exec";
const ADMIN_PASSCODE = "AVIOMED2026";

// ===================== SCREEN CONTROL =====================
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

    const isTarget = id === screenId;
    if (!isTarget) {
      el.style.display = "none";
      return;
    }

    // Blue screens use flex, scrolling screens use block
    if (id === "judgingScreen" || id === "resultsScreen") el.style.display = "block";
    else el.style.display = "flex";
  });

  lockScroll(!(screenId === "judgingScreen" || screenId === "resultsScreen"));
}

window.addEventListener("load", () => {
  showOnly("introScreen");
  lockScroll(true);

  // try syncing if online
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

function sendEntriesToAdmin(entries) {
  const payload = { passcode: String(ADMIN_PASSCODE).trim(), entries };
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

// ===================== JSONP (leaderboard read) =====================
function jsonpLoad(url) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");

    window[cb] = (data) => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      try { delete window[cb]; } catch(e) { window[cb] = undefined; }
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    s.onerror = () => {
      cleanup();
      reject(new Error("JSONP failed"));
    };

    s.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
    document.body.appendChild(s);
  });
}

async function fetchLeaderboardSafe(showName) {
  const url =
    `${ADMIN_URL}?mode=leaderboard` +
    `&show=${encodeURIComponent(showName)}` +
    `&passcode=${encodeURIComponent(String(ADMIN_PASSCODE).trim())}`;

  return await jsonpLoad(url);
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
    try { sendEntriesToAdmin([syncEntry]); }
    catch (e) { queueForSync(syncEntry); }
  } else {
    queueForSync(syncEntry);
  }

  alert("Bird saved!");
  prepareNextBird();
}

function showResults() {
  showOnly("resultsScreen");
  const showName = localStorage.getItem("currentShow") || "";
  document.getElementById("resultsShowName").textContent = showName || "-";

  // Default view
  loadResultsMode("classColour");
}

async function loadResultsMode(mode) {
  const out = document.getElementById("resultsPageContent");
  if (!out) return;

  const showName = localStorage.getItem("currentShow") || "";
  if (!showName) {
    out.innerHTML = "<p>Please select a show first.</p>";
    return;
  }

  out.innerHTML = "<p>Loading results…</p>";

  try {
    const data = await fetchLeaderboardSafe(showName);
    if (!data || data.ok !== true) {
      out.innerHTML = "<p>Could not load Sheet results. Showing local device results instead.</p>" +
        buildLocalResultsHTML_ForCurrentShowClass();
      return;
    }
    out.innerHTML = renderLeaderboardToHTML(data, mode);
  } catch (e) {
    out.innerHTML = "<p>No internet / blocked. Showing local device results instead.</p>" +
      buildLocalResultsHTML_ForCurrentShowClass();
  }
}

// ===== RENDER LEADERBOARD MODES =====
function renderLeaderboardToHTML(data, mode) {
  const results = (data && data.results) ? data.results : {};
  const bestClassColour = results.bestClassColour || [];
  const bestVariety = results.bestVariety || [];
  const bestInBreed = results.bestInBreed || null;

  const currentClass = (localStorage.getItem("currentClass") || "").trim();

  // BEST IN BREED (overall)
  if (mode === "breed") {
    if (!bestInBreed || (!bestInBreed.winner && !bestInBreed.reserve)) {
      return "<p>No Best in Breed yet.</p>";
    }

    const w = bestInBreed.winner;
    const r = bestInBreed.reserve;

    let html = `<h2>Best in Breed (Overall)</h2>`;

    if (w) {
      html += `
        <div style="background:#ffd700;color:black;font-weight:900;padding:12px;border-radius:14px;margin:10px 0;">
          🥇 Best in Breed: Bird ${w.bird_id} — <strong>${w.total}</strong>
          <div style="font-weight:800;opacity:0.85;margin-top:4px;">${w.class} • ${w.colour}</div>
        </div>
      `;
    }
    if (r) {
      html += `
        <div style="background:#c0c0c0;color:black;font-weight:900;padding:12px;border-radius:14px;margin:10px 0;">
          🥈 Reserve Best in Breed: Bird ${r.bird_id} — <strong>${r.total}</strong>
          <div style="font-weight:800;opacity:0.85;margin-top:4px;">${r.class} • ${r.colour}</div>
        </div>
      `;
    }

    return html;
  }

  // BEST IN VARIETY (per colour across ALL classes)
  if (mode === "variety") {
    if (!bestVariety.length) return "<p>No Best in Variety yet.</p>";

    let html = `<h2>Best in Variety (Top 3 per Colour)</h2>`;

    bestVariety.forEach(g => {
      html += `<h3 style="margin-top:16px;">${g.colour} <span style="opacity:0.75;">(entries: ${g.entries || 0})</span></h3>`;

      const top = (g.top3 || []).slice(0, 3);
      if (top.length === 0) {
        html += `<p><em>No ranked birds for this colour yet.</em></p>`;
        return;
      }

      top.forEach((b, i) => {
        let style = "";
        if (i === 0) style = "background:#ffd700;color:black;";
        else if (i === 1) style = "background:#c0c0c0;color:black;";
        else if (i === 2) style = "background:#cd7f32;color:white;";

        html += `
          <div style="${style}font-weight:900;padding:10px;border-radius:12px;margin:6px 0;">
            ${i + 1}. Bird ${b.bird_id} — <strong>${b.total}</strong>
            <span style="font-weight:800;opacity:0.85;">(${b.class})</span>
          </div>
        `;
      });

      html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
    });

    return html;
  }

  // DEFAULT: BEST IN CLASS + COLOUR (Top 5) for selected class
  if (!bestClassColour.length) return "<p>No Best in Class + Colour yet.</p>";

  const filtered = currentClass
    ? bestClassColour.filter(g => String(g.class || "").toUpperCase() === currentClass.toUpperCase())
    : bestClassColour;

  let html = `<h2>Best in Class + Colour (Top 5)</h2>`;
  if (currentClass) html += `<p style="opacity:0.8;"><em>Showing class: ${currentClass}</em></p>`;

  filtered.forEach(g => {
    html += `<h3 style="margin-top:16px;">${g.class} — ${g.colour} <span style="opacity:0.75;">(entries: ${g.entries || 0})</span></h3>`;

    const top = (g.top5 || []).slice(0, 5);
    if (top.length === 0) {
      html += `<p><em>No ranked birds in this group yet.</em></p>`;
      return;
    }

    top.forEach((b, i) => {
      let style = "";
      if (i === 0) style = "background:#ffd700;color:black;";
      else if (i === 1) style = "background:#c0c0c0;color:black;";
      else if (i === 2) style = "background:#cd7f32;color:white;";

      html += `
        <div style="${style}font-weight:900;padding:10px;border-radius:12px;margin:6px 0;">
          ${i + 1}. Bird ${b.bird_id} — <strong>${b.total}</strong>
        </div>
      `;
    });

    html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
  });

  return html;
}

// ===== LOCAL FALLBACK (offline) =====
function buildLocalResultsHTML_ForCurrentShowClass() {
  const showName = localStorage.getItem("currentShow") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.class === className);

  if (birds.length === 0) return "<p>No birds saved yet on this device for this show/class.</p>";

  const grouped = {};
  birds.forEach(b => {
    if (!grouped[b.colour]) grouped[b.colour] = [];
    grouped[b.colour].push(b);
  });

  let html = `<p style="opacity:0.8;"><em>Local device results (offline fallback).</em></p>`;

  Object.keys(grouped).forEach(colKey => {
    const label = COLOUR_LABELS[colKey] || colKey;
    const all = grouped[colKey];
    const ranked = all.filter(x => !x.disqualified).sort((a, b) => Number(b.total) - Number(a.total));

    html += `<h3>${label} (Entries: ${all.length})</h3>`;

    ranked.slice(0, 5).forEach((bird, index) => {
      let style = "";
      if (index === 0) style = "background:#ffd700;color:black;font-weight:900;padding:8px;border-radius:8px;display:block;";
      else if (index === 1) style = "background:#c0c0c0;color:black;font-weight:900;padding:8px;border-radius:8px;display:block;";
      else if (index === 2) style = "background:#cd7f32;color:white;font-weight:900;padding:8px;border-radius:8px;display:block;";

      html += `<p style="${style}">${index + 1}. Bird ${bird.id} — <strong>${bird.total}</strong></p>`;
    });

    html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
  });

  return html;
}

// ===== EXPORT LOCAL CSV (optional) =====
function exportCSV() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  if (birds.length === 0) {
    alert("No local device data to export for this show/judge/class.");
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

