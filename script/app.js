const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const previewCanvas = document.getElementById("previewCanvas");
const previewMeta = document.getElementById("previewMeta");
const statusLine = document.getElementById("statusLine");

const ctx = previewCanvas.getContext("2d");
let imgWidth = 0;
let imgHeight = 0;
let maxChars = 0;
let loadedFileName = "image";

dropzone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    loadedFileName = file.name.replace(/\.png$/i, "");
    dropzone.querySelector(".drop-hint").innerText = file.name;
    loadImage(file);
  }
});

function loadImage(file) {
  if (file.name.toLowerCase().endsWith(".png")) {
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
const passwordInput = document.getElementById("passwordInput");

messageInput.addEventListener("input", () => {
  const typed = messageInput.value.length;
  capacityText.innerText = `${typed} / ${maxChars} chars`;
  const pct = maxChars > 0 ? (typed / maxChars) * 100 : 0;
  capacityFill.style.width = Math.min(pct, 100) + "%";
});

function textToBits(text, marker = "STEG") {
  const bits = [];

  function pushByte(code) {
    const bin = code.toString(2).padStart(8, "0");
    for (let i = 0; i < 8; i++) {
      bits.push(Number(bin[i]));
    }
  }

  for (let i = 0; i < 4; i++) {
    pushByte(marker.charCodeAt(i));
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

const encodeBtn = document.getElementById("encodeBtn");

function hideBits(bits) {
  const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
  const data = imageData.data;
  for (let i = 0; i < bits.length; i++) {
    const dataIdx = Math.floor(i / 3) * 4 + (i % 3);
    data[dataIdx] = (data[dataIdx] & 0xFE) | bits[i];
  }
  ctx.putImageData(imageData, 0, 0);
}

encodeBtn.addEventListener("click", async () => {
  const text = messageInput.value;
  const password = passwordInput.value;
  if (imgWidth === 0) {
    statusLine.innerText = "load an image first";
    return;
  }
  if (text.length === 0) {
    statusLine.innerText = "type a message first";
    return;
  }
  let payload = text;
  let marker = "STEG";
  if (password) {
    payload = await encryptMessage(text, password);
    marker = "LOCK";
  }
  if (payload.length > maxChars) {
    statusLine.innerText = "message too long for this image";
    return;
  }
  hideBits(textToBits(payload, marker));
  statusLine.innerText = password
    ? `locked ${text.length} chars — keep the password safe`
    : `hidden ${text.length} chars — download the PNG to keep them`;
});

const decodeBtn = document.getElementById("decodeBtn");

function readBits(count) {
  const data = ctx.getImageData(0, 0, imgWidth, imgHeight).data;
  const bits = [];
  for (let i = 0; i < count; i++) {
    const dataIdx = Math.floor(i / 3) * 4 + (i % 3);
    bits.push(data[dataIdx] & 1);
  }
  return bits;
}

function bitsToText(bits) {
  let text = "";
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8).join("");
    text += String.fromCharCode(parseInt(byte, 2));
  }
  return text;
}

function revealMessage() {
  const header = readBits(64);
  const marker = bitsToText(header.slice(0, 32));
  if (marker !== "STEG" && marker !== "LOCK") return null;
  const len = parseInt(header.slice(32, 64).join(""), 2);
  const payload = readBits(64 + len * 8).slice(64);
  return { marker: marker, text: bitsToText(payload) };
}

decodeBtn.addEventListener("click", async () => {
  if (imgWidth === 0) {
    statusLine.innerText = "load an image first";
    return;
  }
  const found = revealMessage();
  if (!found) {
    statusLine.innerText = "no hidden message found";
    return;
  }
  if (found.marker === "STEG") {
    messageInput.value = found.text;
    statusLine.innerText = `revealed ${found.text.length} chars`;
  } else {
    const password = passwordInput.value;
    if (!password) {
      statusLine.innerText = "this image is locked — enter the password";
      return;
    }
    try {
      const text = await decryptMessage(found.text, password);
      messageInput.value = text;
      statusLine.innerText = `unlocked ${text.length} chars`;
    } catch (e) {
      statusLine.innerText = "wrong password";
    }
  }
});

async function encryptMessage(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(text))
  );
  const packed = new Uint8Array(16 + 12 + ct.length);
  packed.set(salt, 0);
  packed.set(iv, 16);
  packed.set(ct, 28);
  let s = "";
  for (let i = 0; i < packed.length; i++) s += String.fromCharCode(packed[i]);
  return s;
}

async function decryptMessage(packedStr, password) {
  const packed = new Uint8Array(packedStr.length);
  for (let i = 0; i < packedStr.length; i++) packed[i] = packedStr.charCodeAt(i);
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: packed.slice(0, 16), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: packed.slice(16, 28) }, key, packed.slice(28)
  );
  return new TextDecoder().decode(pt);
}

const downloadBtn = document.getElementById("downloadBtn");

downloadBtn.addEventListener("click", () => {
  if (imgWidth === 0) {
    statusLine.innerText = "load an image first";
    return;
  }
  previewCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = loadedFileName + "_deaddrop.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    statusLine.innerText = "downloaded — the PNG carries your message";
  }, "image/png");
});
