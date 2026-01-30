const sliders = document.querySelectorAll('input[type="range"]');
const totalDisplay = document.getElementById('total');

sliders.forEach(slider => {
  slider.addEventListener('input', calculateTotal);
});

function calculateTotal() {
  let total = 0;
  sliders.forEach(slider => {
    total += parseInt(slider.value);
  });
  totalDisplay.innerText = total;
}

function saveBird() {
  const bird = {
    id: document.getElementById('birdId').value,
    variety: document.getElementById('variety').value,
    head: document.getElementById('head').value,
    body: document.getElementById('body').value,
    legs: document.getElementById('legs').value,
    colour: document.getElementById('colour').value,
    condition: document.getElementById('condition').value,
    total: totalDisplay.innerText
  };

  let birds = JSON.parse(localStorage.getItem('birds')) || [];
  birds.push(bird);
  localStorage.setItem('birds', JSON.stringify(birds));

  alert("Bird saved!");
}

function showResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = 'block';

  let birds = JSON.parse(localStorage.getItem('birds')) || [];

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet.</p>";
    return;
  }

  // Group birds by variety
 grouped[variety].forEach((bird, index) => {
  const winnerStyle = index === 0 ? "style='background:#ffd700;padding:8px;border-radius:5px;'" : "";

  html += `
    <p ${winnerStyle}>
      ${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong>
    </p>
  `;
});



  let html = "";

  Object.keys(grouped).forEach(variety => {
    // Sort by total score (descending)
    grouped[variety].sort((a, b) => b.total - a.total);

    html += `<h3>${variety}</h3>`;

    grouped[variety].forEach((bird, index) => {
      html += `
        <p>
          ${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong>
        </p>
      `;
    });
  });

  resultsDiv.innerHTML = html;
}
