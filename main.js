/*==============================
=   JavaScript From Scratch - JS
=   File: main.js
==============================*/

/*==============================
=   Dark mode and light mode
==============================*/

/* Helper: hex <-> HSL conversion & clamp funcs */

// Clamp helper
function clamp(v, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }

// HEX to RGB
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// RGB to HEX
function rgbToHex(r, g, b) {
    const toHex = x => ('0' + Math.round(x).toString(16)).slice(-2);
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

// RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: (h * 360), s: s * 100, l: l * 100 };
}

// HSL to RGB
function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100; l /= 100;
    if (s === 0) {
        const val = Math.round(l * 255);
        return { r: val, g: val, b: val };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hk = h / 360;
    const t2rgb = (t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + ((q - p) * 6 * t);
        if (t < 1/2) return q;
        if (t < 2/3) return p + ((q - p) * (2/3 - t) * 6);
        return p;
    };
    const r = Math.round(t2rgb(hk + 1/3) * 255);
    const g = Math.round(t2rgb(hk) * 255);
    const b = Math.round(t2rgb(hk - 1/3) * 255);
    return { r, g, b };
}

// Convert HEX -> HSL
function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
}

// Convert HSL -> HEX
function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

/* Paleta generation algorithms */

// Generate monochromatic: vary lightness
function generateMonochrome(baseHsl, count) {
    const arr = [];
    const step = 40 / (count - 1 || 1); // spread lightness +/-20
    for (let i = 0; i < count; i++) {
        // center around base lightness
        const l = clamp(baseHsl.l - 20 + step * i, 6, 96);
        arr.push(hslToHex(baseHsl.h, clamp(baseHsl.s,8,96), l));
    }
    return arr;
}

// Analogous: hues near base
function generateAnalogous(baseHsl, count) {
    const arr = [];
    const span = 30; // +/- span
    const step = (span * 2) / (count - 1 || 1);
    for (let i = 0; i < count; i++) {
        const h = baseHsl.h - span + step * i;
        const s = clamp(baseHsl.s + (i - (count-1)/2) * 4, 12, 92);
        const l = clamp(baseHsl.l + (i - (count-1)/2) * 2, 6, 94);
        arr.push(hslToHex(h, s, l));
    }
    return arr;
}

// Complementary: base and opposite
function generateComplementary(baseHsl, count) {
    const arr = [];
    const complement = (baseHsl.h + 180) % 360;
    const half = Math.floor(count / 2);
    const left = generateAnalogous({h: complement, s: baseHsl.s, l: baseHsl.l}, Math.ceil(count/2));
    const right = generateAnalogous(baseHsl, Math.floor(count/2));
    // interleave to keep base visible
    return right.concat(left);
}

// Triadic: rotate 120 degrees
function generateTriadic(baseHsl, count) {
    const arr = [];
    const paletteBases = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360];
    // Distribute count across 3 hues
    for (let i = 0; i < count; i++) {
        const index = i % 3;
        const h = paletteBases[index];
        const s = clamp(baseHsl.s + (index - 1) * 6, 10, 96);
        const l = clamp(baseHsl.l + (Math.floor(i/3)-1) * 6, 8, 92);
        arr.push(hslToHex(h, s, l));
    }
    return arr;
}

// Tetradic: 4 hues separated
function generateTetradic(baseHsl, count) {
    const arr = [];
    const quads = [baseHsl.h, (baseHsl.h + 90) % 360, (baseHsl.h + 180) % 360, (baseHsl.h + 270) % 360];
    for (let i = 0; i < count; i++) {
        const index = i % 4;
        const h = quads[index];
        const s = clamp(baseHsl.s + (index - 1) * 6, 10, 94);
        const l = clamp(baseHsl.l + (Math.floor(i/4)-1) * 6, 8, 92);
        arr.push(hslToHex(h, s, l));
    }
    return arr;
}

// Master generator: based on harmony
function generatePaletteFrom(hex, harmony, count) {
    // fallback if invalid hex
    try {
        if (!hex || !/^#?[0-9A-Fa-f]{3,6}$/.test(hex)) {
            // choose random hex
            hex = randomHex();
        }
        if (hex[0] !== '#') hex = '#' + hex;
    } catch (e) {
        hex = randomHex();
    }
    const baseHsl = hexToHsl(hex);
    // ensure sane saturation if too low
    if (baseHsl.s < 6) baseHsl.s = 18;
    if (harmony === 'monochromatic') return generateMonochrome(baseHsl, count);
    if (harmony === 'analogous') return generateAnalogous(baseHsl, count);
    if (harmony === 'complementary') return generateComplementary(baseHsl, count);
    if (harmony === 'triadic') return generateTriadic(baseHsl, count);
    if (harmony === 'tetradic') return generateTetradic(baseHsl, count);
    // default
    return generateAnalogous(baseHsl, count);
}

/* Utilities */

// random hex
function randomHex() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
}

// copy text to clipboard with small feedback
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        // small non-blocking visual cue: tiny toast or alert; here we use simple alert fallback for older browsers
        showToast(`${text} copiado.`);
    } catch (err) {
        console.error('Clipboard error', err);
        showToast('No se pudo copiar');
    }
}

// Simple toast (temporary banner)
function showToast(message) {
    const t = document.createElement('div');
    t.className = 'simple-toast';
    t.textContent = message;
    Object.assign(t.style, {
        position: 'fixed', right: '20px', bottom: '20px', background:'#222', color:'#fff',
        padding:'10px 14px', borderRadius:'8px', boxShadow:'0 8px 20px rgba(0,0,0,0.4)', zIndex:9999
    });
    document.body.appendChild(t);
    setTimeout(()=> t.style.opacity = '0', 1400);
    setTimeout(()=> t.remove(), 2000);
}

/* DOM references */
const heroGenerateBtn = document.getElementById('hero-generate');
const generateBtn = document.getElementById('generate-palette');
const hexInput = document.getElementById('hex-input');
const harmonySelect = document.getElementById('harmony-select');
const countSelect = document.getElementById('count-select');
const resultGrid = document.getElementById('result-grid');

const popularGrid = document.getElementById('popular-grid');
const regenPopular = document.getElementById('regen-popular');

const monoGrid = document.getElementById('mono-grid');
const regenMono = document.getElementById('regen-mono');

/* Scrolling from hero to generator */
heroGenerateBtn.addEventListener('click', (e) => {
    document.getElementById('generator').scrollIntoView({behavior:'smooth', block:'start'});
    // small delay to ensure scroll happened then focus input
    setTimeout(()=> hexInput.focus(), 600);
});

/* Generate handler */
function renderGeneratedPalette(hex, harmony, count) {
    resultGrid.innerHTML = '';
    const palette = generatePaletteFrom(hex, harmony, count);
    // create grid cols (bootstrap)
    palette.forEach(col => {
        const wrapper = document.createElement('div');
        wrapper.className = 'col-6 col-sm-4 col-md-3 col-lg-2';

        const square = document.createElement('div');
        square.className = 'color-square';
        square.style.background = col;

        const label = document.createElement('div');
        label.className = 'color-hex';
        label.textContent = col;

        // copy on click
        square.addEventListener('click', () => copyToClipboard(col));

        square.appendChild(label);
        wrapper.appendChild(square);
        resultGrid.appendChild(wrapper);
    });
}

/* Bind generate button */
generateBtn.addEventListener('click', (e) => {
    const hex = hexInput.value.trim();
    const harmony = harmonySelect.value;
    const count = parseInt(countSelect.value, 10) || 5;
    renderGeneratedPalette(hex, harmony, count);
    // scroll to results
    document.getElementById('generated-result').scrollIntoView({behavior:'smooth', block:'center'});
});

/* Popular grid generation: Create 12 palettes (each with 5 swatches) */
function buildPaletteCard(colors) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

    const card = document.createElement('div');
    card.className = 'palette-card';

    const swatchRow = document.createElement('div');
    swatchRow.className = 'swatch-row';

    colors.forEach(c => {
        const sw = document.createElement('div');
        sw.className = 'swatch';
        sw.style.background = c;

        const hexSpan = document.createElement('div');
        hexSpan.className = 'swatch-hex';
        hexSpan.textContent = c;

        // hover shows hex via CSS; click copies
        sw.addEventListener('click', () => copyToClipboard(c));

        sw.appendChild(hexSpan);
        swatchRow.appendChild(sw);
    });

    const action = document.createElement('div');
    action.className = 'card-action';

    const view = document.createElement('a');
    view.href = '#';
    view.textContent = 'Ver paleta';
    view.className = 'link-primary';
    view.onclick = (e) => {
        e.preventDefault();
        // when clicked, show this palette in generator (first color base), scroll to generator
        hexInput.value = colors[0];
        harmonySelect.value = 'analogous';
        countSelect.value = String(colors.length);
        renderGeneratedPalette(colors[0], 'analogous', colors.length);
        document.getElementById('generator').scrollIntoView({behavior:'smooth', block:'start'});
    };

    action.appendChild(view);

    card.appendChild(swatchRow);
    card.appendChild(action);
    col.appendChild(card);

    return col;
}

function randomPalette(count = 5){
    // generate random seed and choose analogous palette for nicer combos
    const base = randomHex();
    return generatePaletteFrom(base, 'analogous', count);
}

function fillPopularGrid(){
    popularGrid.innerHTML = '';
    for (let i = 0; i < 12; i++){
        const p = randomPalette(5);
        popularGrid.appendChild(buildPaletteCard(p));
    }
}

function fillMonoGrid(){
    monoGrid.innerHTML = '';
    for (let i = 0; i < 12; i++){
        const seed = randomHex();
        const p = generatePaletteFrom(seed, 'monochromatic', 5);
        monoGrid.appendChild(buildPaletteCard(p));
    }
}

/* initialize on load */
document.addEventListener('DOMContentLoaded', () => {
    // initial sample generation
    renderGeneratedPalette('#D81B60', 'analogous', 5);

  // fill grids
    fillPopularGrid();
    fillMonoGrid();
});

/* regen handlers */
regenPopular.addEventListener('click', (e) => {
    fillPopularGrid();
    showToast('Nuevas paletas generadas');
});
regenMono.addEventListener('click', (e) => {
    fillMonoGrid();
    showToast('Nuevas paletas monocromáticas');
});

/* Accessibility: pressing Enter while focus on hexInput triggers generate */
    hexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        generateBtn.click();
    }
});

/* small: allow clicking a swatch in generated result to copy too */
resultGrid.addEventListener('click', (e) => {
    const sq = e.target.closest('.color-square');
    if (sq) {
        const hex = sq.querySelector('.color-hex')?.textContent;
        if (hex) copyToClipboard(hex);
    }
});

