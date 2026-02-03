/************** CONFIG **************/
const SERVER_URL = "PASTE_YOUR_WEB_APP_EXEC_URL_HERE"; // your Apps Script /exec
const ADMIN_PASSCODE = "AVIOMED2026"; // case-insensitive server-side

// Orpington colours list (edit anytime)
const ORPINGTON_COLOURS = [
  "BLACK","BLUE","SPLASH","BUFF",
  "GOLD LACED","SILVER LACED",
  "CHOCOLATE","LAVENDER","CUCKOO","SPANGLE",
  "BIRCHEN","JUBILEE","MAHOGANY","LEMON CUCKOO",
  "CRELE","BLUE LACED RED","BLUE PARADE","MOTTLED",
  "WHITE","PARTRIDGE"
];

/************** STATE **************/
let dqOn = false;
let deviceId = localStorage.getItem("device_id") || ("dev_" + Math.random().toString(16).slice(2));
localStorage.setItem("device_id", deviceId);

function getShow() { return (localStorage.getItem("currentShow") || "").trim(); }
function getJudge() { return (localStorage.getItem("currentJudge") || "").trim(); }
function getClass() { return (localStorage.getItem("currentClass") || "").trim(); }
function getColour() { return (localStorage.getItem("currentColour") || "").trim(); }

function setShow(v){ localStorage.setItem("currentShow", (v||"").trim()); }
function setJudge(v){ localStorage.setItem("currentJudge", (v||"").trim()); }
function setClass(v){ localStorage.setItem("currentClass", (v||"").trim()); }
function setColour(v){ localStorage.setItem("currentColour", (v||"").trim()); }

/************** SCREEN NAV **************/
function showOnly(id) {
  const screens = ["introScreen","showScreen","judgeScreen","classScreen","colourScreen","judgingScreen","resultsScreen"];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === id) ? "block" : "none";
  });
}

function goHome(){ showOnly("introScreen"); }
function goShow(){ showOnly("showScreen"); }
function goJudge(){ showOnly("judgeScreen"); }
function goClass(){ showOnly("classScreen"); }
function goColour(){ showOnly("colourScreen"); }
function backToJudging(){ showOnly("judgingScreen"); }

function unlockJudge() {
  // Clears locked show/judge/class/colour selection (does NOT delete saved birds)
  localStorage.removeItem("currentShow");
  localStorage.removeItem("currentJudge");
  localStorage.removeItem("currentClass");
  localStorage.removeItem("currentColour");
  goHome();
}

function resetShowFlow() {
  // New show flow (does NOT delete submissions already synced to sheet)
  unlockJudge();
}

/************** INIT **************/
window.addEventListener("load", () => {
  buildColourList();
  initSliders();
  renderHeaderLabels();
  autoSkipLockedSteps();
  updateSyncStatus("Ready");

  window.addEventListener("online", () => {
    updateSyncStatus("Online — syncing…");
    syncNow();
  });
});

function autoSkipLockedSteps() {
  // If show + judge are locked, skip directly to class selection
  const show = getShow();
  const judge = getJudge();

  if (show && judge) {
    goClass();
  } else {
    goHome();
  }
}

function renderHeaderLabels() {
  const s = document.getElementById("showNameDisplay");
  const j = document.getElementById("judgeNameDisplay");
  const c = document.getElementById("classDisplay");
  const col = document.getElementById("colourDisplay");

  if (s) s.textContent = getShow() || "-";
  if (j) j.textContent = getJudge() || "-";
  if (c) c.textContent = getClass() || "-";
  if (col) col.textContent = getColour() || "-";

  const rShow = document.getElementById("resultsShowName");
  if (rShow) rShow.textContent = getShow() || "-";
}

/************** SHOW + JUDGE LOCK **************/
function saveShowAndContinue() {
  const sel = document.getElementById("showSelect");
  const showName = (sel ? sel.value : "").trim();
  if (!showName) return alert("Please choose a show.");

  setShow(showName);
  renderHeaderLabels();
  goJudge();
}

function saveJudgeAndContinue() {
  const inp = document.getElementById("judgeName");
  const name = (inp ? inp.value : "").trim();
  if (!name) return alert("Please enter judge name.");

  setJudge(name);
  renderHeaderLabels();
  goClass();
}

// Class buttons auto-next
function pickClass(cls) {
  setClass(cls);
  renderHeaderLabels();
  goColour();
}

// Colour buttons auto-next
function pickColour(col) {
  setColour(col);
  renderHeaderLabels();
  goJudging();
}

function goJudging() {
  showOnly("judgingScreen");
  resetScoringUI();
  // Focus Bird ID once when entering judging
  setTimeout(() => {
    const id = document.getElementById("birdId");
    if (id) id.focus();
  }, 80);
}

/************** COLOUR LIST **************/
function buildColourList() {
  const list = document.getElementById("colourList");
  if (!list) return;

  list.innerHTML = "";
  ORPINGTON_COLOURS.forEach(col => {
    const b = document.createElement("button");
    b.className = "btn btn-neutral";
    b.textContent = col;
    b.onclick = () => pickColour(col);
    list.appendChild(b);
  });
}

/************** SLIDERS + TOTAL + LIVE VALUES **************/
let sliders = [];
let totalDisplay = null;

function initSliders() {
  sliders = Array.from(document.querySelectorAll('input[type="range"]'));
  totalDisplay = document.getElementById("total");

  sliders.forEach(sl => {
    sl.addEventListener("input", () => {
      updateSliderValuePills();
      calculateTotal();
    });
  });

  updateSliderValuePills();
  calculateTotal();
}

function updateSliderValuePills() {
  const map = {
    head: "v_head",
    body: "v_body",
    legs: "v_legs",
    colour: "v_colour",
    condition: "v_condition"
  };
  Object.keys(map).forEach(id => {
    const s = document.getElementById(id);
    const pill = document.getElementById(map[id]);
    if (s && pill) pill.textContent = String(s.value);
  });
}

function calculateTotal() {
  let total = 0;
  sliders.forEach(sl => total += Number(sl.value));
  if (totalDisplay) totalDisplay.textContent = String(total);
  return total;
}

/************** DQ **************/
function toggleDQ() {
  dqOn = !dqOn;
  const panel = document.getElementById("dqPanel");
  const status = document.getElementById("dqStatus");
  if (panel) panel.style.display = dqOn ? "block" : "none";
  if (status) status.textContent = "DQ: " + (dqOn ? "Yes" : "No");
}

/************** SAVE BIRD **************/
function getLocalBirds() {
  return JSON.parse(localStorage.getItem("birds") || "[]");
}
function setLocalBirds(arr) {
  localStorage.setItem("birds", JSON.stringify(arr));
}

function makeEntryKey(show, judge, cls, colour, birdId) {
  // Unique key per bird entry (good enough for show day)
  return `${show}|${judge}|${cls}|${colour}|${birdId}|${Date.now()}`;
}

function saveBird() {
  const birdIdEl = document.getElementById("birdId");
  const birdId = (birdIdEl ? birdIdEl.value : "").trim();
  if (!birdId) return alert("Please enter Bird ID.");

  const show = getShow();
  const judge = getJudge();
  const cls = getClass();
  const colour = getColour();

  if (!show || !judge || !cls || !colour) {
    alert("Missing show/judge/class/colour. Go back and select again.");
    return;
  }

  const comment = (document.getElementById("comment")?.value || "").trim();
  const dqReason = (document.getElementById("dqReason")?.value || "").trim();
  const dqNote = (document.getElementById("dqNote")?.value || "").trim();

  const scores = {
    head: Number(document.getElementById("head")?.value || 0),
    body: Number(document.getElementById("body")?.value || 0),
    legs: Number(document.getElementById("legs")?.value || 0),
    colour: Number(document.getElementById("colour")?.value || 0),
    condition: Number(document.getElementById("condition")?.value || 0)
  };

  const total = calculateTotal();

  const entry = {
    entry_key: makeEntryKey(show, judge, cls, colour, birdId),
    device_id: deviceId,
    show,
    judge,
    class: cls,
    colour,
    bird_id: birdId,
    disqualified: dqOn,
    dq_reason: dqOn ? dqReason : "",
    dq_note: dqOn ? dqNote : "",
    total: dqOn ? 0 : total, // DQ doesn't compete
    scores_json: JSON.stringify(scores),
    comment,
    timestamp: new Date().toISOString()
  };

  // Save locally
  const birds = getLocalBirds();
  birds.push(entry);
  setLocalBirds(birds);

  // Queue for sync
  queueEntries([entry]);

  // Auto-next: reset UI for next bird
  resetScoringUI();
  if (birdIdEl) {
    birdIdEl.value = "";
    setTimeout(() => birdIdEl.focus(), 50);
  }

  updateSyncStatus(navigator.onLine ? "Saved — syncing…" : "Saved offline (queued)");

  // Attempt sync now if online
  if (navigator.onLine) syncNow();
}

/************** RESET UI **************/
function resetScoringUI() {
  // reset dq
  dqOn = false;
  document.getElementById("dqPanel") && (document.getElementById("dqPanel").style.display = "none");
  document.getElementById("dqStatus") && (document.getElementById("dqStatus").textContent = "DQ: No");
  const dqReason = document.getElementById("dqReason");
  const dqNote = document.getElementById("dqNote");
  if (dqReason) dqReason.value = "";
  if (dqNote) dqNote.value = "";

  // reset sliders
  ["head","body","legs","colour","condition"].forEach(id => {
    const s = document.getElementById(id);
    if (s) s.value = 0;
  });
  updateSliderValuePills();
  calculateTotal();

  // reset comment
  const c = document.getElementById("comment");
  if (c) c.value = "";
}

/************** SYNC (ALL JUDGES -> ONE SHEET) **************/
function getQueue() {
  return JSON.parse(localStorage.getItem("pending_entries") || "[]");
}
function setQueue(arr) {
  localStorage.setItem("pending_entries", JSON.stringify(arr));
}
function queueEntries(entries) {
  const q = getQueue();
  setQueue(q.concat(entries));
}

function updateSyncStatus(text) {
  const el = document.getElementById("syncStatus");
  if (el) el.textContent = "Status: " + text;
}

async function syncNow() {
  if (!navigator.onLine) {
    updateSyncStatus("Offline (queued)");
    return;
  }

  const q = getQueue();
  if (!q.length) {
    updateSyncStatus("All synced");
    return;
  }

  updateSyncStatus("Syncing " + q.length + "…");

  try {
    const payload = { passcode: ADMIN_PASSCODE, entries: q };
    const res = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data && data.ok) {
      setQueue([]);
      updateSyncStatus("Synced ✅ (" + (data.inserted || 0) + ")");
    } else {
      updateSyncStatus("Sync failed (server reject)");
    }
  } catch (err) {
    updateSyncStatus("Sync failed (network)");
  }
}

/************** EXPORT (THIS DEVICE ONLY) **************/
function exportCSV() {
  const birds = getLocalBirds();
  if (!birds.length) return alert("No data on this device.");

  let csv = "show,judge,class,colour,bird_id,disqualified,dq_reason,dq_note,total,scores_json,comment,timestamp,device_id,entry_key\n";
  birds.forEach(b => {
    const row = [
      b.show, b.judge, b.class, b.colour, b.bird_id,
      b.disqualified, b.dq_reason, b.dq_note, b.total,
      (b.scores_json || "").replaceAll('"','""'),
      (b.comment || "").replaceAll('"','""'),
      b.timestamp, b.device_id, b.entry_key
    ].map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",");
    csv += row + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orpington_judging_results_device.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/************** RESULTS (ALL JUDGES COMBINED) **************/
async function fetchLeaderboard() {
  const showName = getShow();
  if (!showName) {
    alert("No show selected.");
    return null;
  }

  const url = `${SERVER_URL}?mode=leaderboard&show=${encodeURIComponent(showName)}&passcode=${encodeURIComponent(ADMIN_PASSCODE)}`;

  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();
    if (!data.ok) {
      alert("Results error: " + (data.error || "unknown"));
      return null;
    }
    return data;
  } catch (err) {
    alert("Could not load results (check internet).");
    return null;
  }
}

async function openResultsMode(mode) {
  renderHeaderLabels();
  showOnly("resultsScreen");

  const content = document.getElementById("resultsContent");
  if (!content) return;

  content.innerHTML = "<p>Loading results…</p>";

  const payload = await fetchLeaderboard();
  if (!payload) {
    content.innerHTML = "<p>Could not load results.</p>";
    return;
  }

  const results = payload.results || {};

  if (mode === "breed") content.innerHTML = renderBestInBreed(results.bestInBreed);
  else if (mode === "variety") content.innerHTML = renderBestVariety(results.bestVariety || []);
  else content.innerHTML = renderBestClassColour(results.bestClassColour || []);
}

function renderBestInBreed(best) {
  if (!best || !best.winner) return "<p>No data yet.</p>";

  const w = best.winner;
  const r = best.reserve;

  return `
    <h2>Best in Breed</h2>
    <p style="background:#ffd700;color:black;font-weight:900;padding:10px;border-radius:12px;">
      🥇 Best in Breed: Bird ${w.bird_id} — <strong>${w.total}</strong> (${w.class} • ${w.colour})
    </p>
    ${r ? `
      <p style="background:#c0c0c0;color:black;font-weight:900;padding:10px;border-radius:12px;">
        🥈 Reserve Best in Breed: Bird ${r.bird_id} — <strong>${r.total}</strong> (${r.class} • ${r.colour})
      </p>
    ` : `<p>No reserve yet.</p>`}
    <p style="opacity:0.85;">Total birds ranked: ${best.entries || 0}</p>
  `;
}

function renderBestVariety(arr) {
  if (!arr.length) return "<p>No data yet.</p>";

  let html = `<h2>Best in Variety (Top 3 per Colour)</h2>`;
  arr.forEach(g => {
    const top3 = g.top3 || [];
    html += `<h3>${g.colour} <span style="opacity:0.8;">(entries: ${g.entries || 0})</span></h3>`;

    if (!top3.length) {
      html += `<p style="opacity:0.85;">No birds.</p><hr style="border:none;border-top:1px solid #243042;margin:14px 0;">`;
      return;
    }

    top3.forEach((b, i) => {
      let bg = "";
      if (i === 0) bg = "background:#ffd700;color:black;";
      else if (i === 1) bg = "background:#c0c0c0;color:black;";
      else if (i === 2) bg = "background:#cd7f32;color:white;";

      html += `<p style="${bg}font-weight:900;padding:10px;border-radius:12px;margin:6px 0;">
        ${i+1}. Bird ${b.bird_id} — <strong>${b.total}</strong> (${b.class})
      </p>`;
    });

    html += `<hr style="border:none;border-top:1px solid #243042;margin:14px 0;">`;
  });

  return html;
}

function renderBestClassColour(arr) {
  if (!arr.length) return "<p>No data yet.</p>";

  let html = `<h2>Best in Class + Colour (Top 5)</h2>`;
  arr.forEach(g => {
    const top5 = g.top5 || [];
    html += `<h3>${g.class} — ${g.colour} <span style="opacity:0.8;">(entries: ${g.entries || 0})</span></h3>`;

    if (!top5.length) {
      html += `<p style="opacity:0.85;">No birds.</p><hr style="border:none;border-top:1px solid #243042;margin:14px 0;">`;
      return;
    }

    top5.forEach((b, i) => {
      let bg = "";
      if (i === 0) bg = "background:#ffd700;color:black;";
      else if (i === 1) bg = "background:#c0c0c0;color:black;";
      else if (i === 2) bg = "background:#cd7f32;color:white;";

      html += `<p style="${bg}font-weight:900;padding:10px;border-radius:12px;margin:6px 0;">
        ${i+1}. Bird ${b.bird_id} — <strong>${b.total}</strong>
      </p>`;
    });

    html += `<hr style="border:none;border-top:1px solid #243042;margin:14px 0;">`;
  });

  return html;
}
