// ===================== ADMIN SYNC SETTINGS =====================
const ADMIN_URL = "https://script.google.com/macros/s/AKfycbxSvaBUw92c2AwTqHQZihUQLphWRggEZM5Jkm6f58OjVkAsqeizA6nUNKlX1dZZoptx/exec";
const ADMIN_PASSCODE = "AVIOMED2026".trim(); // MUST match EXPECTED_PASSCODE in Code.gs

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

    const isScrollPage = (
      id === "judgingScreen" ||
      id === "resultsScreen" ||
      id === "bestClassPage" ||
      id === "bestVarietyPage" ||
      id === "bestBreedPage"
    );

    el.style.display = (id === screenId) ? (isScrollPage ? "block" : "flex") : "none";
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
 * Upload birds using sendBeacon (reliable for Apps Script web apps)
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

// ===================== EXPORT (NO FETCH) =====================
// These OPEN the Apps Script CSV directly (works even when fetch is blocked).
function buildExportUrl(mode) {
  const showName = localStorage.getItem("currentShow") || "";
  if (!showName) {
    alert("No show selected");
    return "";
  }

  const qs = new URLSearchParams({
    mode,
    show: showName,
    passcode: ADMIN_PASSCODE,
    t: String(Date.now())
  });

  return `${ADMIN_URL}?${qs.toString()}`;
}

function exportWinnersOnline() {
  const url = buildExportUrl("export_winners");
  if (url) window.open(url, "_blank");
}

function exportAllOnline() {
  const url = buildExportUrl("export_all");
  if (url) window.open(url, "_blank");
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

// Tap class = auto-next
function selectClass(className) {
  localStorage.setItem("currentClass", className);
  document.getElementById("classSelectedDisplay").textContent = className;

  setTimeout(() => {
    const cs = document.getElementById("classScreen");
    if (cs && cs.style.display !== "none") saveClassAndContinue();
  }, 120);
}

function saveClassAndContinue() {
  const className = localStorage.getItem("currentClass") || "";
  if (!className) return alert("Please select a class first.");

  document.getElementById("classNameDisplay").textContent = className;

  showOnly("colourScreen");

  const savedColour = localStorage.getItem("currentColour") || "";
  document.getElementById("colourSelectedDisplay").textContent = savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

// Tap colour = auto-next
function selectColour(colourKey) {
  localStorage.setItem("currentColour", colourKey);
  document.getElementById("colourSelectedDisplay").textContent = COLOUR_LABELS[colourKey] || colourKey;

  setTimeout(() => {
    const cs = document.getElementById("colourScreen");
    if (cs && cs.style.display !== "none") saveColourAndContinue();
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

  document.getElementById("birdId").focus();
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
  document.getElementById("colourSelectedDisplay").textContent = savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
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

// ===================== SCORING UX =====================
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

  document.getElementById("commentBox").value = "";
  resetDQUI();
  calculateTotal();

  const birdIdInput = document.getElementById("birdId");
  birdIdInput.value = "";
  birdIdInput.focus();
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
  fields.style.display = (toggle && toggle.checked) ? "block" : "none";
  calculateTotal();
}

function quickDQ() {
  const toggle = document.getElementById("dqToggle");
  if (toggle && !toggle.checked) {
    toggle.checked = true;
    toggleDQ();
  }
  document.getElementById("dqReason").focus();
}

// ===================== SAVE / RESULTS =====================
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

  const isDQ = document.getElementById("dqToggle").checked;
  const dqReason = document.getElementById("dqReason").value.trim();
  const dqNote = document.getElementById("dqNote").value.trim();

  if (isDQ && !dqReason) {
    alert("If Disqualified is selected, please choose a DQ reason.");
    return;
  }

  const comment = document.getElementById("commentBox").value.trim();
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

    ranked.forEach((bird, index) => {
      let style = "";
      if (index === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
      else if (index === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
      else if (index === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;";

      html += `<p style="${style}">${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong></p>`;
    });

    if (dq.length > 0) {
      html += `<p style="margin-top:10px; font-weight:900;">Disqualified:</p>`;
      dq.forEach(b => {
        const reason = escapeHtml(b.dqReason || "No reason");
        html += `<p style="padding:6px 0; opacity:0.95;"><strong>Bird ${escapeHtml(b.id)}</strong> — <em>${reason}</em></p>`;
      });
    }

    html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
  });

  resultsDiv.innerHTML = html;
  showOnly("resultsScreen");
}

// ============================================================
// ✅ ONLINE BEST-OF PAGES (uses fetch if possible, otherwise opens in a tab)
// ============================================================

function buildLeaderboardUrl(showName) {
  const qs = new URLSearchParams({
    mode: "leaderboard",
    show: showName,
    passcode: ADMIN_PASSCODE,
    t: String(Date.now())
  });
  return `${ADMIN_URL}?${qs.toString()}`;
}

function openOnlineResultsTab() {
  const showName = localStorage.getItem("currentShow") || "";
  if (!showName) return alert("No show selected");
  window.open(buildLeaderboardUrl(showName), "_blank");
}

async function fetchOnlineLeaderboardOrThrow() {
  if (!navigator.onLine) throw new Error("No internet");
  const showName = localStorage.getItem("currentShow") || "";
  if (!showName) throw new Error("No show selected");

  const url = buildLeaderboardUrl(showName);

  // Some phones block fetch to Apps Script. If blocked, catch will show a fallback button.
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);

  const data = await res.json();
  if (!data || data.ok !== true) throw new Error(data?.error || "Unknown error");

  return data;
}

function backToResultsFromBestPages() {
  showOnly("resultsScreen");
}

async function openBestClassPage() {
  const container = document.getElementById("bestClassContent");
  container.innerHTML = "<p><em>Loading online results…</em></p>";
  showOnly("bestClassPage");

  try {
    const data = await fetchOnlineLeaderboardOrThrow();
    const list = data.results?.bestClassColour || [];

    if (!list.length) {
      container.innerHTML = "<p><strong>No ranked entries yet.</strong></p>";
      return;
    }

    let html = "";
    list.forEach(block => {
      html += `<h3 style="margin-top:14px;">${escapeHtml(block.class)} — ${escapeHtml(block.colour)}
        <span style="opacity:0.7;">(Entries: ${block.entries ?? 0})</span></h3>`;

      (block.top5 || []).forEach((b, idx) => {
        let style = "";
        if (idx === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
        else if (idx === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
        else if (idx === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;";

        html += `<p style="${style}">
          ${idx + 1}. Bird ${escapeHtml(b.bird_id)} – <strong>${b.total}</strong>
          <span style="opacity:0.75;">(Judge: ${escapeHtml(b.judge)})</span>
        </p>`;
      });

      html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
    });

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `
      <p style="color:#b91c1c;"><strong>ONLINE RESULTS FAILED</strong></p>
      <p>Reason: ${escapeHtml(e?.message || "unknown")}</p>
      <button type="button" onclick="openOnlineResultsTab()"
        style="padding:14px 16px; border-radius:12px; border:none; background:#1e3a8a; color:white; font-weight:900; cursor:pointer;">
        Open Online Results (No Fetch)
      </button>
    `;
  }
}

async function openBestVarietyPage() {
  const container = document.getElementById("bestVarietyContent");
  container.innerHTML = "<p><em>Loading online results…</em></p>";
  showOnly("bestVarietyPage");

  try {
    const data = await fetchOnlineLeaderboardOrThrow();
    const list = data.results?.bestVariety || [];

    if (!list.length) {
      container.innerHTML = "<p><strong>No ranked entries yet.</strong></p>";
      return;
    }

    let html = "";
    list.forEach(block => {
      html += `<h3 style="margin-top:14px;">${escapeHtml(block.colour)}
        <span style="opacity:0.7;">(Entries: ${block.entries ?? 0})</span></h3>`;

      // One card containing all 3 birds
      const top3 = block.top3 || [];
      if (!top3.length) {
        html += `<p><em>No ranked birds.</em></p>`;
      } else {
        html += `<div class="winner-card" style="background:#ffffff;">`;
        top3.forEach((b, idx) => {
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
          html += `<p style="margin:6px 0;">
            ${medal} <strong>${idx + 1}.</strong> Bird ${escapeHtml(b.bird_id)} — <strong>${b.total}</strong>
            <span style="opacity:0.75;">(Class: ${escapeHtml(b.class)} | Judge: ${escapeHtml(b.judge)})</span>
          </p>`;
        });
        html += `</div>`;
      }

      html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
    });

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `
      <p style="color:#b91c1c;"><strong>ONLINE RESULTS FAILED</strong></p>
      <p>Reason: ${escapeHtml(e?.message || "unknown")}</p>
      <button type="button" onclick="openOnlineResultsTab()"
        style="padding:14px 16px; border-radius:12px; border:none; background:#1e3a8a; color:white; font-weight:900; cursor:pointer;">
        Open Online Results (No Fetch)
      </button>
    `;
  }
}

async function openBestInBreedPage() {
  const container = document.getElementById("bestBreedContent");
  container.innerHTML = "<p><em>Loading online results…</em></p>";
  showOnly("bestBreedPage");

  try {
    const data = await fetchOnlineLeaderboardOrThrow();
    const bib = data.results?.bestInBreed || {};
    const winner = bib.winner || null;
    const reserve = bib.reserve || null;

    if (!winner) {
      container.innerHTML = `<p><strong>Total ranked entries:</strong> ${bib.entries ?? 0}</p>
        <p><em>No winner yet.</em></p>`;
      return;
    }

    function card(title, b, bg) {
      return `
        <div class="winner-card" style="background:${bg};">
          <div class="winner-title">${title}</div>
          <div class="winner-grid" style="color:#111827;">
            <div class="kv"><b>Show:</b> ${escapeHtml(b.show)}</div>
            <div class="kv"><b>Judge:</b> ${escapeHtml(b.judge)}</div>
            <div class="kv"><b>Class:</b> ${escapeHtml(b.class)}</div>
            <div class="kv"><b>Colour:</b> ${escapeHtml(b.colour)}</div>
            <div class="kv"><b>Bird ID:</b> ${escapeHtml(b.bird_id)}</div>
            <div class="kv"><b>Total:</b> ${escapeHtml(String(b.total ?? 0))}</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <p style="margin-top:0;"><strong>Total ranked entries:</strong> ${bib.entries ?? 0}</p>
      ${card("🏆 Best in Breed (Winner)", winner, "#fff7cc")}
      ${reserve ? card("🥈 Reserve Best in Breed", reserve, "#f3f4f6") : "<p><em>No reserve yet.</em></p>"}
    `;
  } catch (e) {
    container.innerHTML = `
      <p style="color:#b91c1c;"><strong>ONLINE RESULTS FAILED</strong></p>
      <p>Reason: ${escapeHtml(e?.message || "unknown")}</p>
      <button type="button" onclick="openOnlineResultsTab()"
        style="padding:14px 16px; border-radius:12px; border:none; background:#1e3a8a; color:white; font-weight:900; cursor:pointer;">
        Open Online Results (No Fetch)
      </button>
    `;
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
