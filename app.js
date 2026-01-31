window.addEventListener("load", () => {
  // Always start at intro screen
  const intro = document.getElementById("introScreen");
  const show = document.getElementById("showScreen");
  const judge = document.getElementById("judgingScreen");

  if (intro) intro.style.display = "flex";
  if (show) show.style.display = "none";
  if (judge) judge.style.display = "none";

  document.body.style.overflow = "hidden";
});


// --------- helpers ----------
function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "auto";
}

// --------- intro flow ----------
function startApp() {
  document.getElementById("introScreen").style.display = "none";

  const showScreen = document.getElementById("showScreen");
  showScreen.style.display = "flex";

  document.getElementById("judgingScreen").style.display = "none";

  lockScroll(true);

  // Preselect last used show
  const savedShow = localStorage.getItem("currentShow") || "";
  const sel = document.getElementById("showSelect");
  if (sel && savedShow) sel.value = savedShow;
}

function saveShowAndContinue() {
  const sel = document.getElementById("showSelect");
  const showName = (sel ? sel.value : "").trim();

  if (!showName) {
    alert("Please choose a show.");
    return;
  }

  localStorage.setItem("currentShow", showName);

  const label = document.getElementById("showNameDisplay");
  if (label) label.textContent = showName;

 document.getElementById("showScreen").style.display = "none";
document.getElementById("judgeScreen").style.display = "flex";
document.getElementById("judgingScreen").style.display = "none";

lockScroll(true);

// Pre-fill last judge name if saved
const savedJudge = localStorage.getItem("currentJudge") || "";
const j = document.getElementById("judgeName");
if (j && savedJudge) j.value = savedJudge;

  // allow scroll in judging screen
  lockScroll(false);
}

// Keep intro as first screen on load (no auto-jump yet)
window.addEventListener("load", () => {
  lockScroll(true);
});


// --------- scoring ----------
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


// --------- save bird ----------
function saveBird() {
  const birdId = document.getElementById('birdId').value.trim();
  const varietyInput = document.getElementById('variety').value.trim();

  if (birdId === "" || varietyInput === "") {
    alert("Please enter Bird ID and Variety");
    return;
  }

  const bird = {
    id: birdId,
    variety: varietyInput.toUpperCase(),
    head: Number(document.getElementById('head').value),
    body: Number(document.getElementById('body').value),
    legs: Number(document.getElementById('legs').value),
    colour: Number(document.getElementById('colour').value),
    condition: Number(document.getElementById('condition').value),
    total: Number(totalDisplay.innerText)
  };

  let birds = JSON.parse(localStorage.getItem('birds')) || [];
  birds.push(bird);
  localStorage.setItem('birds', JSON.stringify(birds));

  alert("Bird saved!");
}


// --------- results ----------
function showResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = "block";

  let birds = JSON.parse(localStorage.getItem('birds')) || [];

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet.</p>";
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


// --------- reset ----------
function resetShow() {
  if (confirm("Start a new show? This will delete all birds.")) {
    localStorage.removeItem('birds');
    document.getElementById('results').innerHTML = "";
    alert("New show started.");
  }
}


// --------- export ----------
function exportCSV() {
  let birds = JSON.parse(localStorage.getItem('birds')) || [];

  if (birds.length === 0) {
    alert("No data to export.");
    return;
  }

  const showName = localStorage.getItem("currentShow") || "";

  let csv = "Show,Bird ID,Variety,Head,Body,Legs,Colour,Condition,Total\n";

  birds.forEach(bird => {
    csv += `${showName},${bird.id},${bird.variety},${bird.head},${bird.body},${bird.legs},${bird.colour},${bird.condition},${bird.total}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "orpington_judging_results.csv";
  a.click();

  URL.revokeObjectURL(url);
}
