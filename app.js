// ===================== ADMIN SETTINGS =====================
const ADMIN_URL = "https://script.google.com/macros/s/AKfycbxQoIjAKcVJIIkxtfxm5GVufFx0GGIBD3M4Rl6IDPJc2TQpOi4l6_TwS7vnJCaJ6MjI/exec";
const ADMIN_PASSCODE = "AVIOMED2026".trim();

// ===================== SCREEN CONTROL =====================
function lockScroll(locked) { document.body.style.overflow = locked ? "hidden" : "auto"; }

function showOnly(screenId) {
  const ids = ["introScreen","showScreen","judgeScreen","classScreen","colourScreen","judgingScreen","resultsScreen"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === screenId) el.style.display = (id === "judgingScreen" || id === "resultsScreen") ? "block" : "flex";
    else el.style.display = "none";
  });
  lockScroll(!(screenId === "judgingScreen" || screenId === "resultsScreen"));
}

window.addEventListener("load", () => {
  showOnly("introScreen");
  lockScroll(true);
  if (navigator.onLine) { try { syncPending(); } catch(e) {} }
});

window.addEventListener("online", () => { try { syncPending(); } catch(e) {} });

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
  const payload = { passcode: ADMIN_PASSCODE, entries };
  const blob = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=utf-8" });
  const ok = navigator.sendBeacon(ADMIN_URL, blob);
  if (!ok) throw new Error("sendBeacon failed");
  return { ok:true, inserted: entries.length };
}

function syncPending() {
  const pending = JSON.parse(localStorage.getItem("pendingSync") || "[]");
  if (pending.length === 0) return { ok:true, inserted:0 };
  sendEntriesToAdmin(pending);
  localStorage.removeItem("pendingSync");
  return { ok:true, inserted: pending.length };
}

// ===================== COLOURS =====================
const COLOUR_LABELS = {
  BLACK:"Black", BLUE:"Blue", BUFF:"Buff", WHITE:"White", SPLASH:"Splash", CHOCOLATE:"Chocolate",
  LAVENDER:"Lavender", JUBILEE:"Jubilee", CUCKOO:"Cuckoo", PARTRIDGE:"Partridge",
  SILVER_LACED:"Silver Laced", GOLD_LACED:"Gold Laced", RED:"Red", ISABEL:"Isabel", CRELE:"Crele"
};

function saGroupForColour(colourKey) {
  if (colourKey === "BLACK") return "SA_BLACK";
  if (colourKey === "BLUE" || colourKey === "LAVENDER") return "SA_BLUE_LAV";
  return "SA_BUFF_WHITE_OTHER";
}

// ===================== SA TEMPLATES =====================
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

// ===================== DQ LISTS =====================
const DQ_GENERAL = [
  "Side spikes on comb","White in ear-lobes","Feather or fluff on shanks or feet","Long legs","Any deformity",
  "Yellow skin, yellow beak and yellow on the shanks or feet","Any yellow or sappiness in the white",
  "Coarseness in head, legs or feathers of the buff","Any trimming or faking"
];

const DQ_BY_COLOUR = {
  BLACK:[
    "More than one spot (~12mm) of positive white in any part of plumage",
    "Two or more feathers tipped/edged with positive white",
    "Light coloured beak and eyes",
    "Leg colour other than dark slate"
  ],
  BLUE:[
    "Red, yellow or positive white in plumage",
    "Light coloured beak and eyes",
    "Leg colour other than black or blue"
  ],
  BUFF:["Blue shanks","Coarseness in face"],
  WHITE:["Blue shanks"],
  SPLASH:[
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
  first.value = ""; first.textContent = "-- Select reason --";
  sel.appendChild(first);
  list.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item; opt.textContent = item;
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
  document.getElementById("classSelectedDisplay").textContent = localStorage.getItem("currentClass") || "None";
}

function selectClass(className) {
  localStorage.setItem("currentClass", className);
  document.getElementById("classSelectedDisplay").textContent = className;
  setTimeout(() => saveClassAndContinue(), 120);
}

function saveClassAndContinue() {
  const className = localStorage.getItem("currentClass") || "";
  if (!className) return alert("Please select a class first.");
  document.getElementById("classNameDisplay").textContent = className;
  showOnly("colourScreen");
  const savedColour = localStorage.getItem("currentColour") || "";
  document.getElementById("colourSelectedDisplay").textContent = savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

function selectColour(colourKey) {
  localStorage.setItem("currentColour", colourKey);
  document.getElementById("colourSelectedDisplay").textContent = COLOUR_LABELS[colourKey] || colourKey;
  setTimeout(() => saveColourAndContinue(), 120);
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

function backToClass() { showOnly("classScreen"); }
function backToColour() { showOnly("colourScreen"); }
function backToJudgingFromResults() { showOnly("judgingScreen"); lockScroll(false); }

function newShowHome() {
  const fullReset = confirm("Start a new show?\n\nOK = Clear ALL saved birds on this device.\nCancel = Keep saved birds but go back to Home.");
  if (fullReset) localStorage.removeItem("birds");
  localStorage.removeItem("currentClass");
  localStorage.removeItem("currentColour");
  showOnly("introScreen");
  lockScroll(true);
}

// ===================== STOP JUMPING TO BIRD ID =====================
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
                 min="0" max="${c.max}" value="0"
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

  if (dqToggle && dqToggle.checked) { totalDisplay.textContent = "0"; return; }

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
  if (birdIdInput) { birdIdInput.value = ""; birdIdInput.focus(); }
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
  if (toggle && !toggle.checked) { toggle.checked = true; toggleDQ(); }
  const reason = document.getElementById("dqReason");
  if (reason) reason.focus();
}

// ===================== SAVE BIRD =====================
function saveBird() {
  const birdId = document.getElementById("birdId")?.value.trim() || "";
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";
  const colourKey = localStorage.getItem("currentColour") || "";

  if (!showName || !judgeName || !className || !colourKey) return alert("Please select show, judge, class, and colour first.");
  if (!birdId) return alert("Please enter Bird ID");

  const isDQ = document.getElementById("dqToggle")?.checked || false;
  const dqReason = (document.getElementById("dqReason")?.value || "").trim();
  const dqNote = (document.getElementById("dqNote")?.value || "").trim();
  if (isDQ && !dqReason) return alert("If Disqualified is selected, please choose a DQ reason.");

  const comment = (document.getElementById("commentBox")?.value || "").trim();
  const scores = getScoresObject();
  const total = isDQ ? 0 : Number(document.getElementById("total")?.textContent || "0");

  const bird = { show:showName, judge:judgeName, class:className, colour:colourKey, id:birdId, total, scores, disqualified:isDQ, dqReason, dqNote, comment, timestamp:new Date().toISOString() };

  const birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds.push(bird);
  localStorage.setItem("birds", JSON.stringify(birds));

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

  if (navigator.onLine) { try { sendEntriesToAdmin([syncEntry]); } catch(e) { queueForSync(syncEntry); } }
  else queueForSync(syncEntry);

  alert("Bird saved!");
  prepareNextBird();
}

// ===================== RESULTS (ONLINE via JSONP) =====================
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

    s.onerror = () => { cleanup(); reject(new Error("JSONP failed")); };
    s.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
    document.body.appendChild(s);
  });
}

async function fetchLeaderboard(showName) {
  const pass = encodeURIComponent(ADMIN_PASSCODE);
  const show = encodeURIComponent(showName);
  const url = `${ADMIN_URL}?mode=leaderboard&show=${show}&passcode=${pass}`;
  return await jsonpLoad(url);
}

// Wrapper buttons (Results page)
function viewBestClassColour(){ loadResultsMode("classColour"); }
function viewBestVariety(){ loadResultsMode("variety"); }
function viewBestInBreed(){ loadResultsMode("breed"); }

async function loadResultsMode(mode) {
  const showName = localStorage.getItem("currentShow") || "";
  const className = localStorage.getItem("currentClass") || "";

  showOnly("resultsScreen");
  document.getElementById("resultsShowName").textContent = showName || "-";
  document.getElementById("resultsClassName").textContent = className || "-";

  const resultsDiv = document.getElementById("resultsPageContent");
  resultsDiv.innerHTML = `<p style="font-weight:900;">Loading ONLINE results…</p>`;

  try {
    const data = await fetchLeaderboard(showName);
    if (!data || !data.ok) throw new Error((data && data.error) ? data.error : "No data");

    if (mode === "classColour") renderBestClassColour(data, resultsDiv);
    else if (mode === "variety") renderBestVariety(data, resultsDiv);
    else renderBestInBreed(data, resultsDiv);

  } catch (e) {
    resultsDiv.innerHTML = `
      <p style="color:#b91c1c;font-weight:900;">
        ONLINE RESULTS FAILED → showing LOCAL device results instead.
      </p>
      <p style="opacity:0.85;">Reason: ${String(e && e.message ? e.message : e)}</p>
    `;
    renderLocalFallback(resultsDiv);
  }
}

function showResults() { loadResultsMode("classColour"); }

function renderBestClassColour(data, resultsDiv) {
  const list = (data.results && data.results.bestClassColour) ? data.results.bestClassColour : [];
  let html = `<h2>Best in Class + Colour (Top 5)</h2>`;
  if (list.length === 0) { resultsDiv.innerHTML = html + `<p>No data yet.</p>`; return; }

  list.forEach(block => {
    html += `<h3>${block.class} — ${block.colour} (Entries: ${block.entries})</h3>`;
    (block.top5 || []).forEach((b, i) => {
      const style = i===0 ? "background:#ffd700;" : i===1 ? "background:#c0c0c0;" : i===2 ? "background:#cd7f32;color:white;" : "";
      html += `<p style="padding:8px;border-radius:8px;${style}">${i+1}. Bird ${b.bird_id} — <strong>${b.total}</strong></p>`;
    });
    html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
  });
  resultsDiv.innerHTML = html;
}

function renderBestVariety(data, resultsDiv) {
  const list = (data.results && data.results.bestVariety) ? data.results.bestVariety : [];
  let html = `<h2>Best in Variety (Top 3)</h2>`;
  if (list.length === 0) { resultsDiv.innerHTML = html + `<p>No data yet.</p>`; return; }

  list.forEach(block => {
    html += `<h3>${block.colour} (Entries: ${block.entries})</h3>`;
    (block.top3 || []).forEach((b, i) => {
      const style = i===0 ? "background:#ffd700;" : i===1 ? "background:#c0c0c0;" : "background:#cd7f32;color:white;";
      html += `<p style="padding:8px;border-radius:8px;${style}">${i+1}. Bird ${b.bird_id} — <strong>${b.total}</strong></p>`;
    });
    html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;">`;
  });
  resultsDiv.innerHTML = html;
}

function renderBestInBreed(data, resultsDiv) {
  const bib = (data.results && data.results.bestInBreed) ? data.results.bestInBreed : {};
  let html = `<h2>Best in Breed</h2>`;
  html += `<p><strong>Total ranked entries:</strong> ${bib.entries || 0}</p>`;
  if (!bib.winner) { resultsDiv.innerHTML = html + `<p>No winner yet.</p>`; return; }

  html += `<p style="padding:10px;border-radius:10px;background:#ffd700;font-weight:900;">
    BEST IN BREED: Bird ${bib.winner.bird_id} — ${bib.winner.total}
  </p>`;
  if (bib.reserve) {
    html += `<p style="padding:10px;border-radius:10px;background:#c0c0c0;font-weight:900;">
      RESERVE BEST IN BREED: Bird ${bib.reserve.bird_id} — ${bib.reserve.total}
    </p>`;
  }
  resultsDiv.innerHTML = html;
}

function renderLocalFallback(resultsDiv) {
  const showName = localStorage.getItem("currentShow") || "";
  const className = localStorage.getItem("currentClass") || "";
  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.class === className);

  if (birds.length === 0) { resultsDiv.innerHTML += `<p>No local birds saved for this class.</p>`; return; }
  birds.sort((a,b)=>Number(b.total)-Number(a.total));

  let html = `<h3>LOCAL — ${className} (Entries: ${birds.length})</h3>`;
  birds.slice(0,10).forEach((b,i)=>{ html += `<p>${i+1}. Bird ${b.id} — <strong>${b.total}</strong></p>`; });
  resultsDiv.innerHTML += html;
}

// ===================== EXPORT LOCAL =====================
function exportCSV() {
  const birds = JSON.parse(localStorage.getItem("birds") || "[]");
  if (birds.length === 0) return alert("No local data to export.");

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
  const a = document.createElement("a");
  a.href = url;
  a.download = `orpington_local_export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
