// ---------- FORCE CORRECT START SCREEN ----------
window.addEventListener("load", () => {
  const intro = document.getElementById("introScreen");
  const show = document.getElementById("showScreen");
  const judge = document.getElementById("judgeScreen");
  const classScreen = document.getElementById("classScreen");
  const judging = document.getElementById("judgingScreen");

  if (intro) intro.style.display = "flex";
  if (show) show.style.display = "none";
  if (judge) judge.style.display = "none";
  if (classScreen) classScreen.style.display = "none";
  if (judging) judging.style.display = "none";

  document.body.style.overflow = "hidden";
});

function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "auto";
}

// ---------- INTRO -> SHOW ----------
function startApp() {
  document.getElementById("introScreen").style.display = "none";
  document.getElementById("showScreen").style.display = "flex";
  document.getElementById("judgeScreen").style.display = "none";
  document.getElementById("classScreen").style.display = "none";
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

  const showLabel = document.getElementById("showNameDisplay");
  if (showLabel) showLabel.textContent = showName;

  document.getElementById("showScreen").style.display = "none";
  document.getElementById("judgeScreen").style.display = "flex";
  document.getElementById("classScreen").style.display = "none";
  document.getElementById("judgingScreen").style.display = "none";

  lockScroll(true);

  // Pre-fill last judge name
  const savedJudge = localStorage.getItem("currentJudge") || "";
  const j = document.getElementById("judgeName");
  if (j) j.value = savedJudge;
}

// ---------- JUDGE -> CLASS ----------
function saveJudgeAndContinue() {
  const j = document.getElementById("judgeName");
  const judgeName = (j ? j.value : "").trim();

  if (!judgeName) {
    alert("Please enter the judge name.");
    return;
  }

  localStorage.setItem("currentJudge", judgeName);

  const judgeLabel = document.getElementById("judgeNameDisplay");
  if (judgeLabel) judgeLabel.textContent = judgeName;

  document.getElementById("judgeScreen").style.display = "none";
  document.getElementById("classScreen").style.display = "flex";
  document.getElementById("judgingScreen").style.display = "none";

  lockScroll(true);

  // Show selected class if saved
  const savedClass = localStorage.getItem("currentClass") || "";
  const disp = document.getElementById("classSelectedDisplay");
  if (disp) disp.textContent = savedClass || "None";
}

function selectClass(className) {
  localStorage.setItem("currentClass", className);

  const disp = document.getElementById("classSelectedDisplay");
  if (disp) disp.textContent = className;
}

// ---------- CLASS -> JUDGING ----------
function saveClassAndContinue() {
  const className = localStorage.getItem("currentClass") || "";

  if (!className) {
    alert("Please select a class first.");
    return;
  }

  const classLabel = document.getElementById("classNameDisplay");
  if (classLabel) classLabel.textContent = className;

  document.getElementById("classScreen").style.display = "none";
  document.getElementById("judgingScreen").style.display = "block";

  lockScroll(false);

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
  const className = localStorage.getItem("currentClass") || "";

  if (!showName || !judgeName || !className) {
    alert("Please select a show, enter judge name, and select class first.");
    return;
  }

  if (birdId === "" || varietyInput === "") {
    alert("Please enter Bird ID and Variety");
    return;
  }

  const bird = {
    show: showName,
    judge: judgeName,
    class: className,
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

  // clear bird id for speed
  document.getElementById('birdId').value = "";

  alert("Bird saved!");
}

// ---------- RESULTS (filtered by show+judge+class) ----------
function showResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = "block";

  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem('birds')) || [];
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet for this show/judge/class.</p>";
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
  if (confirm("Start a new show? This will delete ALL saved birds on this device.")) {
    localStorage.removeItem('birds');
    document.getElementById('results').innerHTML = "";
    alert("New show started.");
  }
}

// ---------- EXPORT (filtered by show+judge+class) ----------
function exportCSV() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem('birds')) || [];
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  if (birds.length === 0) {
    alert("No data to export for this show/judge/class.");
    return;
  }

  let csv = "Show,Judge,Class,Bird ID,Variety,Head,Body,Legs,Colour,Condition,Total,Timestamp\n";

  birds.forEach(bird => {
    csv += `"${bird.show}","${bird.judge}","${bird.class}",${bird.id},${bird.variety},${bird.head},${bird.body},${bird.legs},${bird.colour},${bird.condition},${bird.total},${bird.timestamp}\n`;
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

