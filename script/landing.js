const lamp = document.getElementById("lamp");
const uv = document.getElementById("uv");
const safeButton=document.getElementById("uvToggle");

const notes = document.querySelectorAll(".secret-note");
const counter = document.getElementById("counter");
const allFound = document.getElementById("allFound");
let foundCount = 0;

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
  

})

