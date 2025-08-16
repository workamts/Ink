/*==============================
=   Ink - JS
=   File: main.js
==============================*/

/*====================================
=   Event Listeners & Initializations
====================================*/

// DOM references
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

document.addEventListener('DOMContentLoaded', function () {
    // DOM references
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

    // Convert to uppercase in real time
    hexInput.addEventListener('input', function () {
        this.value = this.value.toUpperCase();
    });

    // Show 12 palettes in Popular and Monochromatic on page load
    fillPopularGrid();
    fillMonoGrid();

    // Validation before generating
    generateBtn.addEventListener('click', function (e) {
        let hexVal = hexInput.value.trim().toUpperCase();
        const harmonyVal = harmonySelect.value;
        const countVal = countSelect.value;

        // Only allow if at least 3 valid characters (0-9, A-F)
        const hexRegex = /^[0-9A-F]{3,6}$/;
        if (!hexVal || hexVal.length < 3 || !hexRegex.test(hexVal)) {
            e.preventDefault();
            resultGrid.innerHTML = '';
            generateBtn.classList.add('btn-danger');
            setTimeout(() => generateBtn.classList.remove('btn-danger'), 1200);
            return;
        }

        // Convert to 6 characters according to rules:
        if (hexVal.length === 3) {
            hexVal = hexVal[0] + hexVal[0] + hexVal[1] + hexVal[1] + hexVal[2] + hexVal[2];
        } else if (hexVal.length === 4) {
            hexVal = hexVal[0] + hexVal[0] + hexVal[1] + hexVal[1] + hexVal[2] + hexVal[3];
        } else if (hexVal.length === 5) {
            hexVal = hexVal[0] + hexVal[0] + hexVal[1] + hexVal[1] + hexVal[2] + hexVal[3];
        }

        hexInput.value = hexVal; // Update input to show full HEX

        renderGeneratedPalette(hexVal, harmonyVal, parseInt(countVal, 10) || 5);
        document.getElementById('generated-result').scrollIntoView({behavior:'smooth', block:'center'});
    });

    // Scrolling from hero to generator
    heroGenerateBtn.addEventListener('click', (e) => {
        document.getElementById('generator').scrollIntoView({behavior:'smooth', block:'start'});
        setTimeout(()=> hexInput.focus(), 600);
    });

    // Regenerate popular and monochromatic grids
    regenPopular.addEventListener('click', (e) => {
        fillPopularGrid();
        showToast('New palettes generated');
    });
    regenMono.addEventListener('click', (e) => {
        fillMonoGrid();
        showToast('New monochromatic palettes generated');
    });

    // Accessibility: Enter key in hexInput generates palette
    hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    // Copy color when clicking on generated swatch
    resultGrid.addEventListener('click', (e) => {
        const sq = e.target.closest('.color-square');
        if (sq) {
            const hex = sq.querySelector('.color-hex')?.textContent;
            if (hex) copyToClipboard(hex);
        }
    });
});



/*==============================
=   Render generated palette
==============================*/

function renderGeneratedPalette(hex, harmony, count) {
    resultGrid.innerHTML = '';
    const palette = generatePaletteFrom(hex, harmony, count);
    palette.forEach(col => {
        const wrapper = document.createElement('div');
        wrapper.className = 'color-square';

        const square = document.createElement('div');
        square.className = 'color-square';
        square.style.background = col;

        const label = document.createElement('div');
        label.className = 'color-hex';
        label.textContent = col.toUpperCase();

        // Set text color based on background (luminance)
        const { r, g, b } = hexToRgb(col);
        const luminance = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
        label.style.color = luminance > 0.7 ? '#222' : '#fff';

        square.appendChild(label);
        wrapper.appendChild(square);
        resultGrid.appendChild(wrapper);

        square.addEventListener('click', () => copyToClipboard(col.toUpperCase()));
    });
}



/*======================================
=   Helper Functions (Color Conversion)
======================================*/

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

// random hex
function randomHex() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
}



/*==============================
=   Paleta Generator Section
==============================*/

// Generate monochromatic: vary lightness
function generateMonochrome(baseHsl, count) {
    const arr = [];
    const step = 40 / (count - 1 || 1); // spread lightness +/-20
    for (let i = 0; i < count; i++) {
        const l = clamp(baseHsl.l - 20 + step * i, 6, 96);
        arr.push(hslToHex(baseHsl.h, clamp(baseHsl.s,8,96), l));
    }
    return arr;
}

// Analogous: hues near base
function generateAnalogous(baseHsl, count) {
    const arr = [];
    const span = 30;
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
    const left = generateAnalogous({h: complement, s: baseHsl.s, l: baseHsl.l}, Math.ceil(count/2));
    const right = generateAnalogous(baseHsl, Math.floor(count/2));
    return right.concat(left);
}

// Triadic: rotate 120 degrees
function generateTriadic(baseHsl, count) {
    const arr = [];
    const paletteBases = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360];
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
    try {
        if (!hex || !/^#?[0-9A-Fa-f]{3,6}$/.test(hex)) {
            hex = randomHex();
        }
        if (hex[0] !== '#') hex = '#' + hex;
    } catch (e) {
        hex = randomHex();
    }
    const baseHsl = hexToHsl(hex);
    if (baseHsl.s < 6) baseHsl.s = 18;
    if (harmony === 'monochromatic') return generateMonochrome(baseHsl, count);
    if (harmony === 'analogous') return generateAnalogous(baseHsl, count);
    if (harmony === 'complementary') return generateComplementary(baseHsl, count);
    if (harmony === 'triadic') return generateTriadic(baseHsl, count);
    if (harmony === 'tetradic') return generateTetradic(baseHsl, count);
    return generateAnalogous(baseHsl, count);
}



/*==============================
=   Popular Section
==============================*/

function buildPaletteCard(colors, harmonyType = 'analogous') {
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

        // Set text color based on luminance
        const { r, g, b } = hexToRgb(c);
        const luminance = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
        hexSpan.style.color = luminance > 0.7 ? '#222' : '#fff';

        sw.addEventListener('click', () => copyToClipboard(c));

        sw.appendChild(hexSpan);
        swatchRow.appendChild(sw);
    });

    const action = document.createElement('div');
    action.className = 'card-action';

    const view = document.createElement('a');
    view.href = '#';
    view.textContent = 'View Palette';
    view.className = 'link-primary';
    view.onclick = (e) => {
        e.preventDefault();
        hexInput.value = colors[0].replace('#', '');
        harmonySelect.value = harmonyType;
        countSelect.value = String(colors.length);
        renderGeneratedPalette(colors[0], harmonyType, colors.length);
        document.getElementById('generator').scrollIntoView({behavior:'smooth', block:'start'});
    };

    action.appendChild(view);

    card.appendChild(swatchRow);
    card.appendChild(action);

    return card;
}

function randomPalette(type = 'analogous', count = 5) {
    let base, harmony = type;
    // Earth tones: natural and muted colors
    if (type === 'earth') {
        const earthBases = [
            '#A0522D',
            '#8B4513',
            '#C2B280',
            '#6B8E23',
            '#BDB76B',
            '#D2B48C',
            '#8F9779',
        ];
        base = earthBases[Math.floor(Math.random() * earthBases.length)];
        harmony = 'monochromatic';
    } else {
        base = randomHex();
    }
    return generatePaletteFrom(base, harmony, count);
}

function fillPopularGrid() {
    popularGrid.innerHTML = '';
    const types = [
        'analogous',
        'complementary',
        'tetradic',
        'triadic',
        'earth'
    ];
    const totalPalettes = 12;
    for (let i = 0; i < totalPalettes; i++) {
        const type = types[i % types.length];
        const p = randomPalette(type, 5);
        const harmonyType = type === 'earth' ? 'earth' : type;
        popularGrid.appendChild(buildPaletteCard(p, harmonyType));
    }
}



/*==============================
=   Monochromatic Section
==============================*/

function fillMonoGrid(){
    monoGrid.innerHTML = '';
    for (let i = 0; i < 12; i++){
        const seed = randomHex();
        const p = generatePaletteFrom(seed, 'monochromatic', 5);
        monoGrid.appendChild(buildPaletteCard(p, 'monochromatic'));
    }
}



/*==============================
=   Utilities & Toasts
==============================*/

// Copy text to clipboard with small feedback
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(`${text} copied.`);
    } catch (err) {
        console.error('Clipboard error', err);
        showToast('Could not copy');
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

