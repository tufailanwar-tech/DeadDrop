const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const previewCanvas = document.getElementById("previewCanvas");
const previewMeta = document.getElementById("previewMeta");
const statusLine = document.getElementById("statusLine");

const ctx = previewCanvas.getContext("2d");
let imgWidth = 0;
let imgHeight = 0;
let maxChars = 0;

dropzone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    dropzone.querySelector(".drop-hint").innerText = file.name;
    loadImage(file);
  }
});


function loadImage(file){
  if (file.name.toLowerCase().endsWith(".png")){
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      imgWidth = img.width;
      imgHeight = img.height;
      maxChars = Math.floor((imgWidth * imgHeight * 3 - 64) / 8);
      previewMeta.innerText = `${file.name} — ${img.width}x${img.height}`;
      statusLine.innerText = "image loaded — type a message";
      URL.revokeObjectURL(img.src);


    };
    img.src = URL.createObjectURL(file);

  } else {
    statusLine.innerText = "only PNG images — JPEG destroys hidden data";
  }
}

const messageInput = document.getElementById("messageInput");
const capacityText = document.getElementById("capacityText");
const capacityFill = document.getElementById("capacityFill");

messageInput.addEventListener("input",()=>{
  const typed = messageInput.value.length;
  capacityText.innerText = `${typed} / ${maxChars} chars`;
  const pct = maxChars > 0 ? (typed / maxChars) * 100 : 0;
  capacityFill.style.width = Math.min(pct, 100) + "%";
})


function textToBits(text) {
  const bits = [];

  function pushByte(code) {
    const bin = code.toString(2).padStart(8, "0");
    for (let i = 0; i < 8; i++) {
      bits.push(Number(bin[i]));
    }
  }

  for (let i = 0; i < 4; i++) {
    pushByte("STEG".charCodeAt(i));
  }

  const lenBin = text.length.toString(2).padStart(32, "0");
  for (let i = 0; i < 32; i++) {
    bits.push(Number(lenBin[i]));
  }

  for (let i = 0; i < text.length; i++) {
    pushByte(text.charCodeAt(i));
  }

  return bits;
}
