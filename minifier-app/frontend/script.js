const API_URL = 'http://localhost:5001/minify';

const sourceEl = document.getElementById('source');
const resultEl = document.getElementById('result');
const minifyBtn = document.getElementById('minifyBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const typeSelect = document.getElementById('typeSelect');
const fileInput = document.getElementById('fileInput');
const origSizeEl = document.getElementById('origSize');
const minSizeEl = document.getElementById('minSize');
const reductionEl = document.getElementById('reduction');
const dropZone = document.getElementById('dropZone');

function updateOrigSize(){
  const len = new TextEncoder().encode(sourceEl.value || '').length;
  origSizeEl.textContent = `Original: ${formatBytes(len)}`;
}
function formatBytes(bytes){
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes / Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i];
}

sourceEl.addEventListener('input', updateOrigSize);
window.addEventListener('load', updateOrigSize);

minifyBtn.addEventListener('click', async () => {
  const code = sourceEl.value;
  const type = typeSelect.value;
  if (!code.trim()) return alert('Add some code first.');
  minifyBtn.disabled = true;
  minifyBtn.textContent = 'Minifying...';
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ code, type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Minify failed');
    resultEl.value = data.minified;
    minSizeEl.textContent = `Minified: ${formatBytes(data.minifiedSize)}`;
    reductionEl.textContent = `Reduction: ${calcReduction(data.originalSize, data.minifiedSize)}`;
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    minifyBtn.disabled = false;
    minifyBtn.textContent = 'Minify';
  }
});

copyBtn.addEventListener('click', async () => {
  if (!resultEl.value) return;
  try {
    await navigator.clipboard.writeText(resultEl.value);
    copyBtn.textContent = 'Copied ✓';
    setTimeout(()=> copyBtn.textContent = 'Copy', 1400);
  } catch (e) {
    alert('Copy failed: ' + e.message);
  }
});

downloadBtn.addEventListener('click', () => {
  if (!resultEl.value) return;
  const type = typeSelect.value;
  const ext = type === 'js' ? 'min.js' : type === 'css' ? 'min.css' : 'min.html';
  const fname = `output.${ext}`;
  const blob = new Blob([resultEl.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fname; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
});

function calcReduction(orig, min) {
  if (!orig) return '-';
  const pct = ((1 - min / orig) * 100).toFixed(2);
  return `${pct}%`;
}

/* File input + drag/drop */
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  readFile(file);
});
async function readFile(file){
  const text = await file.text();
  sourceEl.value = text;
  updateOrigSize();
  autoDetectType(file.name);
}

function autoDetectType(filename){
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'js') typeSelect.value = 'js';
  else if (ext === 'css') typeSelect.value = 'css';
  else if (ext === 'html' || ext === 'htm') typeSelect.value = 'html';
}

/* Drag & Drop */
['dragenter','dragover'].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault(); dropZone.classList.add('dragging');
  });
});
['dragleave','drop'].forEach(ev => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault(); dropZone.classList.remove('dragging');
  });
});
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) readFile(f);
});

/* Paste button focuses the textarea so user can paste */
document.getElementById('pasteBtn').addEventListener('click', () => {
  sourceEl.focus();
});

/* Beautify placeholder (optionally integrate prettier later) */
document.getElementById('beautifyBtn').addEventListener('click', () => {
  alert('Beautify not implemented in this demo. Use an online beautifier or integrate Prettier/JS-Beautify.');
});
