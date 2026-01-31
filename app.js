// ---------- FORCE CORRECT START SCREEN (prevents weird cached states) ----------
window.addEventListener("load", () => {
  const intro = document.getElementById("introScreen");
  const show = document.getElementById("showScreen");
  const judge = document.getElementById("judgeScreen");
  const judging = document.getElementById("judgingScreen");

  if (intro) intro.style.display = "flex";
  if (show) show.style.display = "none";
  if (judge) judge.style.display = "none";
  if (judging) judging.style.display = "none";

  // lock scroll on full-screen pages
  document.body.style.overflow = "hidden";
});

// Helper to lock/unlock scrolling (intro/show/judge locked, judging unlocked)
function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "auto";
}

// ---------- INTRO -> SHOW SELECTION ----------
function startApp() {
  document.getElementById("introScreen").style.display = "none";
  document.getElementById("showScreen").style.display = "flex";
  document.getElementById("judgeScreen").style.display = "none";
  document.getElementById("judgingScreen").style.display = "none";

  lockScroll(true);

  // Preselect last used show
  const savedShow = localStorage.getItem("currentShow") || "";
  const sel = document.getElementById("showSelect");
  if (sel && savedShow) sel.value = savedShow;
}

// ---------- SHOW -> JUDGE ----------
function saveShowAndContinue() {
  const sel = document.getElementById("showSelect");
  const showName = (sel ? sel.value : "").trim();

  if (!showName) {
    alert("Please choose a show.");
    return;
  }

  localStorage.setItem("currentShow", showName);

  // show name on judging screen
  const showLabel = document.getElementById("showNameDisplay");
  if (showLabel) showLabel.textContent = showName;

  document.getElementById("showScreen").style.display = "none";
  document.getElementById("judgeScreen").style.display = "flex";
  document.getElementById("judgingScreen").style.display = "none";

  lockScroll(true);

  // Pre-fill last judge name
  const savedJudge = localStorage.getItem("currentJudge") || "";
  const j = document.getElementById("judgeName");
  if (j) j.value = savedJudge;
}

// ---------- JUDGE -> JUDGING ----------
function saveJudgeAndContinue() {
  const j = document.getElementById("judgeName");
  const judgeName = (j ? j.value : "").trim();

  if (!judgeName) {
    alert("Please enter the judge name.");
    return;
  }

  localStorage.setItem("currentJudge", judgeName);

  // show judge on judging screen
  const judgeLabel = document.getElementById("judgeNameDisplay");
  if (judgeLabel) judgeLabel.textContent = judgeName;

  document.getElementById("judgeScreen").style.display = "none";
  document.getElementById("judgingScreen").style.display = "block";

  // allow scrolling on judging screen
  lockScroll(false);

  // Make sure totals start correct
  calculateTotal();
}

// ---------- SCORING ----------
const sliders = document.querySelectorAll('input[type="range"]');
const totalDisplay = document.getElementById('total');

sliders.forEach(slider => {
  slider.addEventListener('input', calculateTotal);
});

function calculateTotal() {
  let total = 0;
  sliders.forEach(slider => {
    total += Number(slider.value);
  });
  totalDisplay.innerText = total;
}

// ---------- SAVE BIRD ----------
function saveBird() {
  const birdId = document.getElementById('birdId').value.trim();
  const varietyInput = document.getElementById('variety').value.trim();

  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";

  if (!showName || !judgeName) {
    alert("Please select a show and enter judge name first.");
    return;
  }

  if (birdId === "" || varietyInput === "") {
    alert("Please enter Bird ID and Variety");
    return;
  }

  const bird = {
    show: showName,
    judge: judgeName,
    id: birdId,
    variety: varietyInput.toUpperCase(),
    head: Number(document.getElementById('head').value),
    body: Number(document.getElementById('body').value),
    legs: Number(document.getElementById('legs').value),
    colour: Number(document.getElementById('colour').value),
    condition: Number(document.getElementById('condition').value),
    total: Number(totalDisplay.innerText),
    timestamp: new Date().toISOString()
  };

  let birds = JSON.parse(localStorage.getItem('birds')) || [];
  birds.push(bird);
  localStorage.setItem('birds', JSON.stringify(birds));

  // Optional: clear Bird ID for next entry
  document.getElementById('birdId').value = "";

  alert("Bird saved!");
}

// ---------- RESULTS ----------
function showResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = "block";

  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";

  let birds = JSON.parse(localStorage.getItem('birds')) || [];

  // Show only birds for this show + judge
  birds = birds.filter(b => b.show === showName && b.judge === judgeName);

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet for this show/judge.</p>";
    return;
  }

  const grouped = {};

  birds.forEach(bird => {
    if (!grouped[bird.variety]) grouped[bird.variety] = [];
    grouped[bird.variety].push(bird);
  });

  let html = "";

  Object.keys(grouped).forEach(variety => {
    grouped[variety].sort((a, b) => Number(b.total) - Number(a.total));

    html += `<h3>${variety} (Total entries: ${grouped[variety].length})</h3>`;

    grouped[variety].forEach((bird, index) => {
      let style = "";

      if (index === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
      else if (index === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
      else if (index === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;";

      html += `<p style="${style}">${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong></p>`;
    });
  });

  resultsDiv.innerHTML = html;
}

// ---------- RESET ----------
function resetShow() {
  if (confirm("Start a new show? This will delete all birds for ALL shows on this device.")) {
    localStorage.removeItem('birds');
    document.getElementById('results').innerHTML = "";
    alert("New show started.");
  }
}

// ---------- EXPORT ----------
function exportCSV() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";

  let birds = JSON.parse(localStorage.getItem('birds')) || [];
  birds = birds.filter(b => b.show === showName && b.judge === judgeName);

  if (birds.length === 0) {
    alert("No data to export for this show/judge.");
    return;
  }

  let csv = "Show,Judge,Bird ID,Variety,Head,Body,Legs,Colour,Condition,Total,Timestamp\n";

  birds.forEach(bird => {
    csv += `"${bird.show}","${bird.judge}",${bird.id},${bird.variety},${bird.head},${bird.body},${bird.legs},${bird.colour},${bird.condition},${bird.total},${bird.timestamp}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  // filename includes show + judge
  const safeShow = showName.replace(/[^a-z0-9]+/gi, "_");
  const safeJudge = judgeName.replace(/[^a-z0-9]+/gi, "_");
  a.download = `orpington_results_${safeShow}_${safeJudge}.csv`;

  a.click();
  URL.revokeObjectURL(url);
}
