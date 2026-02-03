const SERVER_URL = "PASTE_YOUR_NEW_EXEC_URL_HERE";
const PASSCODE = "AVIOMED2026";

let state = {};

function show(id) {
  ["introScreen","showScreen","judgeScreen","classScreen","colourScreen","judgingScreen"]
    .forEach(s => document.getElementById(s).style.display = (s===id?"block":"none"));
}

function goShow(){ show("showScreen"); }

function saveShow(){
  const v = showSelect.value;
  if(!v) return alert("Select show");
  state.show = v;
  show("judgeScreen");
}

function saveJudge(){
  const v = judgeName.value.trim();
  if(!v) return alert("Enter judge");
  state.judge = v;
  show("classScreen");
}

function pickClass(c){
  state.class = c;
  show("colourScreen");
}

function startJudging(){
  state.colour = colourSelect.value;
  document.getElementById("context").innerText =
    `${state.show} • ${state.judge} • ${state.class} • ${state.colour}`;
  show("judgingScreen");
}

const sliders = ["head","body","legs","colourScore","condition"];
sliders.forEach(id=>{
  document.getElementById(id).addEventListener("input", calc);
});

function calc(){
  let t = 0;
  sliders.forEach(id => t += Number(document.getElementById(id).value));
  total.innerText = t;
}

function saveBird(){
  const id = birdId.value.trim();
  if(!id) return alert("Bird ID required");

  const entry = {
    entry_key: Date.now()+"_"+Math.random(),
    device_id: navigator.userAgent,
    show: state.show,
    judge: state.judge,
    class: state.class,
    colour: state.colour,
    bird_id: id,
    disqualified: false,
    dq_reason: "",
    dq_note: "",
    total: Number(total.innerText),
    scores_json: JSON.stringify({
      head: head.value,
      body: body.value,
      legs: legs.value,
      colour: colourScore.value,
      condition: condition.value
    }),
    comment: "",
    timestamp: new Date().toISOString()
  };

  fetch(SERVER_URL,{
    method:"POST",
    headers:{ "Content-Type":"text/plain;charset=utf-8" },
    body: JSON.stringify({ passcode: PASSCODE, entries:[entry] })
  })
  .then(r=>r.json())
  .then(j=>{
    if(!j.ok) return alert("Upload failed");
    birdId.value="";
    sliders.forEach(id=>document.getElementById(id).value=0);
    calc();
  })
  .catch(()=>alert("Offline – will retry later"));
}

function viewResults(){
  alert("Results screen coming next (leaderboard ready)");
}

