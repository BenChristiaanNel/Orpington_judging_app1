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

function showResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = "block";

  let birds = JSON.parse(localStorage.getItem('birds')) || [];

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet.</p>";
    return;
  }

  const grouped = {};

  // Group birds by variety
  birds.forEach(bird => {
    if (!grouped[bird.variety]) grouped[bird.variety] = [];
    grouped[bird.variety].push(bird);
  });

  let html = "";

  Object.keys(grouped).forEach(variety => {
    // Sort birds numerically by total descending
    grouped[variety].sort((a, b) => Number(b.total) - Number(a.total));

    // Display variety and total entries
    html += `<h3>${variety} (Total entries: ${grouped[variety].length})</h3>`;

    grouped[variety].forEach((bird, index) => {
  let highlight = "";

  if (index === 0) highlight = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;"; // Gold
  else if (index === 1) highlight = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;"; // Silver
  else if (index === 2) highlight = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;"; // Bronze

  html += `<p style="${highlight}">${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong></p>`;
});

  resultsDiv.innerHTML = html;
}



function resetShow() {
  if (confirm("Start a new show? This will delete all birds.")) {
    localStorage.removeItem('birds');
    document.getElementById('results').innerHTML = "";
    alert("New show started.");
  }
}

function exportCSV() {
  let birds = JSON.parse(localStorage.getItem('birds')) || [];

  if (birds.length === 0) {
    alert("No data to export.");
    return;
  }

  let csv = "Bird ID,Variety,Head,Body,Legs,Colour,Condition,Total\n";

  birds.forEach(bird => {
    csv += `${bird.id},${bird.variety},${bird.head},${bird.body},${bird.legs},${bird.colour},${bird.condition},${bird.total}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "orpington_judging_results.csv";
  a.click();

  URL.revokeObjectURL(url);
}
