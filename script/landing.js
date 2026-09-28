const lamp = document.getElementById("lamp");
const uv = document.getElementById("uv");
const safeButton=document.getElementById("uvToggle");

const notes = document.querySelectorAll(".secret-note");
const counter = document.getElementById("counter");
const allFound = document.getElementById("allFound");
let foundCount = 0;

// localStorage: restore safelight state
if (localStorage.getItem("safelight") === "SAFELIGHT: ON") {
  safeButton.innerText = "SAFELIGHT: ON";
  uv.classList.remove("open");
  lamp.classList.remove("open");
}else{
  safeButton.innerText = "SAFELIGHT: OFF";
  uv.classList.add("open");
  lamp.classList.add("open");
}

// localStorage: restore found notes
JSON.parse(localStorage.getItem("foundNotes") || "[]").forEach((i) => {
  notes[i].classList.add("found");
});
foundCount = document.querySelectorAll(".secret-note.found").length;
counter.innerText = `NOTES FOUND: ${foundCount}/3`;
if (foundCount === 3) {
  allFound.textContent = "◈ ALL NOTES DEVELOPED — the darkroom gives up its secrets.";
}

document.addEventListener("mousemove", (e) => {
  lamp.style.left = `${e.clientX}px`;
  lamp.style.top = `${e.clientY}px`;

  document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
  document.documentElement.style.setProperty("--my", `${e.clientY}px`);

  notes.forEach((note)=>{

    if(note.classList.contains("found")) return;

    const rect=note.getBoundingClientRect();
    const noteX=rect.left+rect.width/2;
    const noteY=rect.top+rect.height/2;

    const dx = e.clientX - noteX;
    const dy = e.clientY - noteY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if(distance < 120){
      note.classList.add("found");
      foundCount+=1;

      counter.innerText=`NOTES FOUND: ${foundCount}/3`;

      // localStorage: remember which note was found
      const idx = [...notes].indexOf(note);
      const found = JSON.parse(localStorage.getItem("foundNotes") || "[]");
      found.push(idx);
      localStorage.setItem("foundNotes", JSON.stringify(found));

    }
    if(foundCount===3){
      allFound.textContent = "◈ ALL NOTES DEVELOPED — the darkroom gives up its secrets.";
    }
  })

});

let check=false;
safeButton.addEventListener("click",()=>{
  if(safeButton.innerText==="SAFELIGHT: OFF"){
    safeButton.innerText="SAFELIGHT: ON"
    uv.classList.remove("open");
    lamp.classList.remove("open");
  }else{
    safeButton.innerText="SAFELIGHT: OFF"
    uv.classList.add("open");
    lamp.classList.add("open");
  }

  // localStorage: remember safelight state
  localStorage.setItem("safelight", safeButton.innerText);

})

// pixels boxs
{
  const flipWrap = document.querySelector('.pixels');
  flipWrap.innerHTML = `
    <div class="pixelBox">0100100<span class="bit">0</span></div>
    <div class="pixelBox">0100100<span class="bit">1</span></div>
    <div class="pixelBox">0100100<span class="bit">0</span></div>
    <div class="pixelBox">0100100<span class="bit">0</span></div>
    <div class="pixelBox">0100100<span class="bit">1</span></div>
    <div class="pixelBox">0100100<span class="bit">0</span></div>
    <div class="pixelBox">0100100<span class="bit">0</span></div>
    <div class="pixelBox">0100100<span class="bit">0</span></div>
  `;

  const hiddenBits = document.getElementById("hiddenBits");
  const bigChar = document.getElementById("bigChar");

  const flipCells = document.querySelectorAll(".pixelBox");

  // localStorage: restore flipped bits
  const savedBits = localStorage.getItem("flipperBits");
  if (savedBits && savedBits.length === 8) {
    flipCells.forEach((cell, i) => {
      cell.innerHTML = `0100100<span class="bit">${savedBits[i]}</span>`;
    });
  }

  function updateReadout() {
    let bits = "";
    flipCells.forEach((cell) => {
      bits += cell.textContent[7];
    });
    hiddenBits.innerText = bits;
    bigChar.innerText = String.fromCharCode(parseInt(bits, 2));
    // localStorage: remember the bits
    localStorage.setItem("flipperBits", bits);
  }

  flipCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      cell.classList.remove("flipping");
      void cell.offsetWidth;
      cell.classList.add("flipping");
      if (cell.textContent === "01001000") {
        cell.innerHTML = '0100100<span class="bit">1</span>';
      } else {
        cell.innerHTML = '0100100<span class="bit">0</span>';
      }
      updateReadout();
    });
  });

  updateReadout();
}
