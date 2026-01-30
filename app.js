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
