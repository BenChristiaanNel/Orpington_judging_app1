// ----------------- SCREEN HELPERS -----------------
function lockScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "auto";
}

function showOnly(screenId) {
  const ids = ["introScreen", "showScreen", "judgeScreen", "classScreen", "colourScreen", "judgingScreen"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === screenId)
      ? (id === "judgingScreen" ? "block" : "flex")
      : "none";
  });

  lockScroll(screenId !== "judgingScreen");
}

// Always start clean (prevents “white screen”)
window.addEventListener("load", () => {
  showOnly("introScreen");
  lockScroll(true);
});

// ----------------- COLOUR TEMPLATES (FULLY CUSTOM) -----------------
const TEMPLATES = {
  BLACK: {
    name: "Black — solid colour emphasis",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Overall Orpington shape, depth, balance." },
      { key:"head", label:"Head & Comb", max:10, help:"Comb, face, eyes, wattles." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Leg colour/feathering, stance." },
      { key:"colour_depth", label:"Colour Depth & Sheen", max:30, help:"Deep black with strong sheen." },
      { key:"colour_even", label:"Evenness (no rusting)", max:10, help:"No brown/rust patches, even colour." },
      { key:"condition", label:"Condition", max:10, help:"Health, feather condition, cleanliness." },
    ]
  },
  BLUE: {
    name: "Blue — even shade + correct lacing",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type and balance." },
      { key:"head", label:"Head & Comb", max:10, help:"Comb/face/eyes." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet/stance." },
      { key:"blue_shade", label:"Blue Shade Evenness", max:20, help:"Even slate-blue tone." },
      { key:"blue_lacing", label:"Lacing Quality", max:20, help:"Clear lacing, not smudged." },
      { key:"condition", label:"Condition", max:10, help:"Health and feather quality." },
    ]
  },
  BUFF: {
    name: "Buff — uniform colour + richness",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Depth, width, Orpington shape." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Leg/feet/stance." },
      { key:"buff_rich", label:"Colour Richness", max:20, help:"Rich buff tone, not washed out." },
      { key:"buff_even", label:"Colour Uniformity", max:20, help:"Even shade (hackle/saddle/wing)." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  WHITE: {
    name: "White — purity + cleanliness",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"white_purity", label:"White Purity", max:30, help:"Pure white with no brassiness." },
      { key:"white_clean", label:"Cleanliness / Stain-free", max:10, help:"No stains or discoloration." },
      { key:"condition", label:"Condition", max:10, help:"Feather and body condition." },
    ]
  },
  SPLASH: {
    name: "Splash — clean pattern distribution",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"splash_base", label:"Base Colour Cleanliness", max:15, help:"Clean light base." },
      { key:"splash_mark", label:"Marking Quality", max:25, help:"Blue/black splashes: clear and well placed." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather quality." },
    ]
  },
  CHOCOLATE: {
    name: "Chocolate — richness + evenness",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"choc_depth", label:"Chocolate Depth", max:25, help:"Deep chocolate tone." },
      { key:"choc_even", label:"Evenness / No fading", max:15, help:"Even colour across body." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather quality." },
    ]
  },
  LAVENDER: {
    name: "Lavender — uniform dilution",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type and balance." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"lav_even", label:"Lavender Evenness", max:25, help:"Even lavender tone overall." },
      { key:"lav_clean", label:"Colour Cleanliness", max:15, help:"No patchiness, clean tone." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  JUBILEE: {
    name: "Jubilee — spangle/pattern clarity",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"jub_ground", label:"Ground Colour Quality", max:15, help:"Correct base tone." },
      { key:"jub_pattern", label:"Pattern / Spangles", max:25, help:"Clear markings, well defined pattern." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather quality." },
    ]
  },
  CUCKOO: {
    name: "Cuckoo — barring",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"cuckoo_bar", label:"Barring Clarity", max:25, help:"Clear, crisp barring." },
      { key:"cuckoo_even", label:"Barring Evenness", max:15, help:"Even barring across body." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  PARTRIDGE: {
    name: "Partridge — pencilling/detail",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"partr_mark", label:"Markings / Pencilling", max:25, help:"Correct detail and pencilling." },
      { key:"partr_hackle", label:"Hackle/Saddle Colour", max:15, help:"Correct tone, clean definition." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather quality." },
    ]
  },
  SILVER_LACED: {
    name: "Silver Laced — lacing + ground colour",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"sl_ground", label:"Ground Colour (Silver)", max:15, help:"Clean silver ground." },
      { key:"sl_lacing", label:"Lacing Definition", max:25, help:"Sharp, even lacing." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  GOLD_LACED: {
    name: "Gold Laced — lacing + ground colour",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"gl_ground", label:"Ground Colour (Gold)", max:15, help:"Rich gold ground." },
      { key:"gl_lacing", label:"Lacing Definition", max:25, help:"Sharp, even lacing." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  RED: {
    name: "Red — richness + uniformity",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"red_rich", label:"Red Richness", max:25, help:"Deep red tone." },
      { key:"red_even", label:"Uniformity", max:15, help:"Even colour across body." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  ISABEL: {
    name: "Isabel — soft tone + even dilution",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"is_tone", label:"Isabel Tone Quality", max:20, help:"Correct soft isabel tone." },
      { key:"is_even", label:"Evenness / Cleanliness", max:20, help:"Even tone, no patchiness." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
  CRELE: {
    name: "Crele — pattern & clarity",
    criteria: [
      { key:"type", label:"Body & Type", max:30, help:"Orpington type." },
      { key:"head", label:"Head & Comb", max:10, help:"Head points." },
      { key:"legs", label:"Legs & Feet", max:10, help:"Legs/feet." },
      { key:"crele_bar", label:"Barring / Pattern", max:25, help:"Clear crele pattern." },
      { key:"crele_colour", label:"Colour Correctness", max:15, help:"Correct ground colour + contrast." },
      { key:"condition", label:"Condition", max:10, help:"Condition and feather care." },
    ]
  },
};

// Friendly display labels
const COLOUR_LABELS = {
  BLACK:"Black", BLUE:"Blue", BUFF:"Buff", WHITE:"White", SPLASH:"Splash",
  CHOCOLATE:"Chocolate", LAVENDER:"Lavender", JUBILEE:"Jubilee",
  CUCKOO:"Cuckoo", PARTRIDGE:"Partridge", SILVER_LACED:"Silver Laced", GOLD_LACED:"Gold Laced",
  RED:"Red", ISABEL:"Isabel", CRELE:"Crele"
};

// ----------------- FLOW -----------------
function startApp() {
  showOnly("showScreen");

  // Preselect last used show
  const savedShow = localStorage.getItem("currentShow") || "";
  const sel = document.getElementById("showSelect");
  if (sel && savedShow) sel.value = savedShow;
}

function saveShowAndContinue() {
  const sel = document.getElementById("showSelect");
  const showName = (sel ? sel.value : "").trim();
  if (!showName) return alert("Please choose a show.");

  localStorage.setItem("currentShow", showName);
  const showLabel = document.getElementById("showNameDisplay");
  if (showLabel) showLabel.textContent = showName;

  showOnly("judgeScreen");

  // Pre-fill last judge
  const savedJudge = localStorage.getItem("currentJudge") || "";
  const j = document.getElementById("judgeName");
  if (j) j.value = savedJudge;
}

function saveJudgeAndContinue() {
  const j = document.getElementById("judgeName");
  const judgeName = (j ? j.value : "").trim();
  if (!judgeName) return alert("Please enter the judge name.");

  localStorage.setItem("currentJudge", judgeName);
  const judgeLabel = document.getElementById("judgeNameDisplay");
  if (judgeLabel) judgeLabel.textContent = judgeName;

  showOnly("classScreen");

  const savedClass = localStorage.getItem("currentClass") || "";
  const disp = document.getElementById("classSelectedDisplay");
  if (disp) disp.textContent = savedClass || "None";
}

function selectClass(className) {
  localStorage.setItem("currentClass", className);
  const disp = document.getElementById("classSelectedDisplay");
  if (disp) disp.textContent = className;
}

function saveClassAndContinue() {
  const className = localStorage.getItem("currentClass") || "";
  if (!className) return alert("Please select a class first.");

  const classLabel = document.getElementById("classNameDisplay");
  if (classLabel) classLabel.textContent = className;

  showOnly("colourScreen");

  const savedColour = localStorage.getItem("currentColour") || "";
  const disp = document.getElementById("colourSelectedDisplay");
  if (disp) disp.textContent = savedColour ? (COLOUR_LABELS[savedColour] || savedColour) : "None";
}

function selectColour(colourKey) {
  localStorage.setItem("currentColour", colourKey);
  const disp = document.getElementById("colourSelectedDisplay");
  if (disp) disp.textContent = COLOUR_LABELS[colourKey] || colourKey;
}

function saveColourAndContinue() {
  const colourKey = localStorage.getItem("currentColour") || "";
  if (!colourKey) return alert("Please select a colour first.");

  const colourLabel = document.getElementById("colourNameDisplay");
  if (colourLabel) colourLabel.textContent = COLOUR_LABELS[colourKey] || colourKey;

  // Build the scoring template UI for that colour
  renderTemplate(colourKey);

  showOnly("judgingScreen");
  lockScroll(false);
  calculateTotal();
}

// ----------------- DYNAMIC SCORING UI -----------------
function renderTemplate(colourKey) {
  const template = TEMPLATES[colourKey];
  const container = document.getElementById("scoringContainer");
  const tName = document.getElementById("templateName");

  if (!container || !tName) return;

  if (!template) {
    tName.textContent = "No template found for this colour.";
    container.innerHTML = "";
    return;
  }

  tName.textContent = template.name;

  let html = "";
  template.criteria.forEach(c => {
    html += `
      <div class="score-row">
        <label>${c.label} <span class="score-max">(0–${c.max})</span></label>
        ${c.help ? `<div class="score-help">${c.help}</div>` : ""}
        <input
          type="range"
          min="0"
          max="${c.max}"
          value="0"
          data-crit-key="${c.key}"
          data-crit-max="${c.max}"
          class="score-slider"
        />
      </div>
    `;
  });

  container.innerHTML = html;

  // Attach listeners to newly created sliders
  const sliders = container.querySelectorAll(".score-slider");
  sliders.forEach(s => s.addEventListener("input", calculateTotal));
}

function getCurrentTemplate() {
  const colourKey = localStorage.getItem("currentColour") || "";
  return TEMPLATES[colourKey] || null;
}

function calculateTotal() {
  const container = document.getElementById("scoringContainer");
  const totalDisplay = document.getElementById("total");
  if (!container || !totalDisplay) return;

  let total = 0;
  container.querySelectorAll(".score-slider").forEach(sl => {
    total += Number(sl.value);
  });

  totalDisplay.textContent = total;
}

function getScoresObject() {
  const container = document.getElementById("scoringContainer");
  const template = getCurrentTemplate();
  const scores = {};
  if (!container || !template) return scores;

  template.criteria.forEach(c => {
    const el = container.querySelector(`[data-crit-key="${c.key}"]`);
    scores[c.key] = el ? Number(el.value) : 0;
  });

  return scores;
}

// ----------------- SAVE / RESULTS / EXPORT -----------------
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

  const scores = getScoresObject();
  const total = Number(document.getElementById("total").textContent || "0");

  const bird = {
    show: showName,
    judge: judgeName,
    class: className,
    colour: colourKey,              // selected colour key
    variety: colourKey,             // keep compatibility with existing results grouping
    id: birdId,
    total,
    scores,                         // FULL template scores
    timestamp: new Date().toISOString()
  };

  const birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds.push(bird);
  localStorage.setItem("birds", JSON.stringify(birds));

  // speed: clear Bird ID only
  document.getElementById("birdId").value = "";
  alert("Bird saved!");
}

function showResults() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.style.display = "block";

  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  if (birds.length === 0) {
    resultsDiv.innerHTML = "<p>No birds saved yet for this show/judge/class.</p>";
    return;
  }

  const grouped = {};
  birds.forEach(b => {
    if (!grouped[b.variety]) grouped[b.variety] = [];
    grouped[b.variety].push(b);
  });

  let html = "";
  Object.keys(grouped).forEach(varietyKey => {
    grouped[varietyKey].sort((a, b) => Number(b.total) - Number(a.total));
    const label = COLOUR_LABELS[varietyKey] || varietyKey;

    html += `<h3>${label} (Total entries: ${grouped[varietyKey].length})</h3>`;

    grouped[varietyKey].forEach((bird, index) => {
      let style = "";
      if (index === 0) style = "background:#ffd700;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
      else if (index === 1) style = "background:#c0c0c0;color:black;font-weight:bold;padding:8px;border-radius:5px;display:block;";
      else if (index === 2) style = "background:#cd7f32;color:white;font-weight:bold;padding:8px;border-radius:5px;display:block;";

      html += `<p style="${style}">${index + 1}. Bird ${bird.id} – <strong>${bird.total}</strong></p>`;
    });
  });

  resultsDiv.innerHTML = html;
}

function resetShow() {
  if (confirm("Start a new show? This will delete ALL saved birds on this device.")) {
    localStorage.removeItem("birds");
    const resultsDiv = document.getElementById("results");
    if (resultsDiv) resultsDiv.innerHTML = "";
    alert("New show started.");
  }
}

function exportCSV() {
  const showName = localStorage.getItem("currentShow") || "";
  const judgeName = localStorage.getItem("currentJudge") || "";
  const className = localStorage.getItem("currentClass") || "";

  let birds = JSON.parse(localStorage.getItem("birds") || "[]");
  birds = birds.filter(b => b.show === showName && b.judge === judgeName && b.class === className);

  if (birds.length === 0) {
    alert("No data to export for this show/judge/class.");
    return;
  }

  // Store scores safely as JSON in a single column (because templates differ per colour)
  let csv = "Show,Judge,Class,Colour,Bird ID,Total,ScoresJSON,Timestamp\n";

  birds.forEach(b => {
    const colourLabel = COLOUR_LABELS[b.colour] || b.colour;
    const scoresJson = JSON.stringify(b.scores || {}).replace(/"/g, '""'); // CSV-safe
    csv += `"${b.show}","${b.judge}","${b.class}","${colourLabel}","${b.id}",${b.total},"${scoresJson}",${b.timestamp}\n`;
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
