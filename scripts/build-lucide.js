#!/usr/bin/env node
// Genera public/lucide-react.min.js (IIFE) dal build CJS del pacchetto installato.
// Da eseguire dopo ogni aggiornamento di lucide-react.
// Uso: node scripts/build-lucide.js

const fs   = require('fs')
const path = require('path')

const cjsPath = path.join(__dirname, '../node_modules/lucide-react/dist/cjs/lucide-react.js')
const outPath = path.join(__dirname, '../public/lucide-react.min.js')
const version = require('../node_modules/lucide-react/package.json').version

if (!fs.existsSync(cjsPath)) {
  console.error('lucide-react CJS not found — run npm install first')
  process.exit(1)
}

const cjs = fs.readFileSync(cjsPath, 'utf-8')

const bundle = `/** lucide-react v${version} — IIFE bundle for Sensei iframe */
(function() {
  var module = { exports: {} };
  var exports = module.exports;
  var require = function(m) {
    if (m === 'react') return window.React;
    throw new Error('Sensei Lucide bundle: cannot require ' + m);
  };
${cjs}
  window.LucideReact = module.exports;
})();
`

fs.writeFileSync(outPath, bundle, 'utf-8')
const kb = (fs.statSync(outPath).size / 1024).toFixed(1)
console.log(`public/lucide-react.min.js — lucide-react v${version} — ${kb} KB`)
