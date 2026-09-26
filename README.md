# DeadDrop

DeadDrop — hide encrypted secret messages inside ordinary images with LSB steganography. Pure HTML/CSS/JS, no backend, no dependencies.

## The landing — a photo darkroom

The landing page is a darkroom. Your cursor carries an inspection lamp that lifts the darkness where you look. Hidden inside are **3 secret notes** — sweep the lamp over the page to develop them, like film in a tray.

- 🔦 Inspection lamp follows the cursor (CSS variables `--mx` / `--my`)
- 💡 Safelight toggle — kill the red darkroom light and go bright
- 🕵️ Hidden-notes game with proximity detection, live counter, and a photo-developing reveal animation
- 🧬 Interactive LSB specimen — click pixel cells to flip bits and spell letters

## The app

- **Encode** — drop in a cover image, type a message, optional password, live capacity meter, download as PNG
- **Decode** — drop the image back in, enter the password if there was one, read the message
- 🔑 AES-256-GCM encryption with PBKDF2 key derivation (Web Crypto API)
- 100% client-side — images and messages never leave the browser

## How it works

1. Text → bytes (`TextEncoder`) → bits
2. Optional: encrypt the bytes with AES-256-GCM
3. A 9-byte header goes first: magic `STEG`, encryption flag, payload length
4. Each bit replaces the **least significant bit** of a pixel channel — `(value & 0xFE) | bit` — changing 200 to 201, invisible to the eye
5. Export as PNG

Decode reverses it: read the LSBs → validate the `STEG` header → decrypt → text.

> ⚠️ Always share as **PNG**. JPEG compression destroys the hidden bits.

## Run it

No build step, no install, no server. Just double-click `landing.html` — done.

## Project structure

```
deaddrop/
├── landing.html      # darkroom landing page
├── index.html        # the steganography app
├── css/
│   ├── landing.css   # darkroom theme
│   └── styles.css    # app theme
└── js/
    ├── landing.js    # lamp, safelight toggle, notes game, bit flipper
    ├── stego.js      # core LSB encode/decode, bit packing (no DOM)
    ├── crypto.js     # PBKDF2 + AES-GCM via Web Crypto
    └── app.js        # app UI: drag & drop, canvas, capacity meter
```

## What this teaches

Canvas `ImageData`, typed arrays, bitwise ops, `TextEncoder`/`TextDecoder`, File API, drag & drop, Web Crypto (`async/await`, PBKDF2, AES-GCM), CSS variables, proximity detection, `getBoundingClientRect`.

## Ideas to extend it

- Compare slider: original vs stego image (they should look identical)
- Progress bar for large images
- Capacity heatmap on a second canvas
- Encode → decode round-trip tests in plain Node.js
