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

// Legge e minifica il logo Sensei per usarlo come placeholder inline
const senseiSvgRaw = fs.readFileSync(path.join(__dirname, '../src/assets/sensei-logo.svg'), 'utf-8')
const senseiSvg = senseiSvgRaw
  .replace(/<\?xml[^>]*\?>\s*/g, '')
  .replace(/<!DOCTYPE[^>]*>\s*/g, '')
  .replace(/<style>[^<]*<\/style>/gs, '')
  .replace(/class="sensei-eye"/g, '')
  .replace('fill="currentColor"', 'fill="__COLOR__"')
  .replace(/\s+/g, ' ')
  .trim()

// Mappa icone rinominate in lucide-react v1.x (vecchio → nuovo).
// Usata nel Proxy a runtime nell'iframe, indipendentemente dalla sanitizzazione.
const deprecated = {
  CheckCircle:'CircleCheck', CheckCircle2:'CircleCheckBig',
  AlertCircle:'CircleAlert', AlertOctagon:'OctagonAlert', AlertTriangle:'TriangleAlert',
  XCircle:'CircleX', XOctagon:'OctagonX', XSquare:'SquareX',
  PlusCircle:'CirclePlus', PlusSquare:'SquarePlus',
  MinusCircle:'CircleMinus', MinusSquare:'SquareMinus',
  ArrowUpCircle:'CircleArrowUp', ArrowDownCircle:'CircleArrowDown',
  ArrowLeftCircle:'CircleArrowLeft', ArrowRightCircle:'CircleArrowRight',
  ChevronUpCircle:'CircleChevronUp', ChevronDownCircle:'CircleChevronDown',
  ChevronLeftCircle:'CircleChevronLeft', ChevronRightCircle:'CircleChevronRight',
  HelpCircle:'CircleHelp', DotCircle:'CircleDot',
  Home:'House', Grid:'Grid3x3',
  BarChart:'ChartColumn', BarChart2:'ChartColumnBig',
  LineChart:'ChartLine', AreaChart:'ChartArea', PieChart:'ChartPie',
  Loader2:'LoaderCircle', MoreHorizontal:'Ellipsis',
  MoreVertical:'EllipsisVertical', ExternalLink:'SquareArrowOutUpRight',
}

const bundle = `/** lucide-react v${version} — IIFE bundle for Sensei iframe */
(function() {
  var module = { exports: {} };
  var exports = module.exports;
  var require = function(m) {
    if (m === 'react') return window.React;
    throw new Error('Sensei Lucide bundle: cannot require ' + m);
  };
${cjs}
  var DEPRECATED = ${JSON.stringify(deprecated)};
  var SENSEI_SVG = ${JSON.stringify(senseiSvg)};
  function SenseiFallbackIcon(props) {
    var size  = (props && props.size)  || 24;
    var color = (props && props.color) || 'currentColor';
    var src   = 'data:image/svg+xml,' + encodeURIComponent(SENSEI_SVG.replace('__COLOR__', color));
    return window.React.createElement('img', {
      src: src, width: size, height: size,
      style: { opacity: 0.3, flexShrink: 0, display: 'inline-block' },
      title: 'Icona non disponibile'
    });
  }
  window.LucideReact = new Proxy(module.exports, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      var alias = DEPRECATED[prop];
      if (alias && alias in target) return target[alias];
      return SenseiFallbackIcon;
    }
  });
})();
`

fs.writeFileSync(outPath, bundle, 'utf-8')
const kb = (fs.statSync(outPath).size / 1024).toFixed(1)
console.log(`public/lucide-react.min.js — lucide-react v${version} — ${kb} KB`)

// Genera anche il whitelist ESM (per il renderer) e JSON (per main.js)
// Estrae i nomi dal file .d.ts per evitare di caricare React in Node.js
const dtsPath = path.join(__dirname, '../node_modules/lucide-react/dist/lucide-react.d.ts')
const dts = fs.readFileSync(dtsPath, 'utf-8')
const names = [...dts.matchAll(/^declare const ([A-Z][A-Za-z0-9]+):/gm)]
  .map(m => m[1])
  .sort()

const esmPath  = path.join(__dirname, '../src/utils/lucideWhitelist.js')
const jsonPath = path.join(__dirname, '../src/utils/lucide-whitelist.json')

const esmContent = `export const LUCIDE_WHITELIST = [\n  ${names.map(n => JSON.stringify(n)).join(',\n  ')},\n]\n`
fs.writeFileSync(esmPath,  esmContent, 'utf-8')
fs.writeFileSync(jsonPath, JSON.stringify(names), 'utf-8')
console.log(`src/utils/lucideWhitelist.js + lucide-whitelist.json — ${names.length} icons`)
