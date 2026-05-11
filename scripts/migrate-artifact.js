#!/usr/bin/env node
// Migrazione assistita al Sensei Artifact Standard.
// Legge un artifact legacy e stampa il blocco export default da incollare.
// Non modifica il file sorgente.
//
// Uso: node scripts/migrate-artifact.js courses/mio-corso.jsx

const fs   = require('fs')
const path = require('path')

const filePath = process.argv[2]

if (!filePath) {
  console.error('Uso: node scripts/migrate-artifact.js <path-artifact.jsx>')
  process.exit(1)
}

if (!fs.existsSync(filePath)) {
  console.error(`File non trovato: ${filePath}`)
  process.exit(1)
}

const code = fs.readFileSync(filePath, 'utf-8')

// Rileva se è già nel nuovo formato
if (/export\s+default\s+\{/.test(code) && /\bcomponent\s*:/.test(code)) {
  console.log('Questo artifact usa già il Sensei Artifact Standard.')
  process.exit(0)
}

// Trova il nome del componente principale
const fnMatch = code.match(/export\s+default\s+function\s+(\w+)/) ||
                code.match(/export\s+default\s+class\s+(\w+)/)

if (!fnMatch) {
  console.error('Impossibile trovare "export default function NomeComponente" nel file.')
  console.error('Assicurati che il file usi "export default function" o "export default class".')
  process.exit(1)
}

const componentName = fnMatch[1]

// Legge SENSEI_TYPE se presente
const typeMatch = code.match(/export\s+const\s+SENSEI_TYPE\s*=\s*['"](\w+)['"]/)
const type = typeMatch ? typeMatch[1] : 'sentiero'

// Genera title dal filename
const basename = path.basename(filePath, '.jsx')
const title = basename.replace(/^\d+-/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

console.log('\n// ─────────────────────────────────────────────────────────────────────────')
console.log('// Sensei Artifact Standard — istruzioni di migrazione')
console.log('//')
console.log(`// 1. Rimuovi "export default function ${componentName}" dalla definizione`)
console.log(`//    e sostituiscila con "function ${componentName}"`)
console.log('//')
console.log('// 2. Incolla questo blocco IN FONDO al file (dopo la definizione del componente):')
console.log('// ─────────────────────────────────────────────────────────────────────────\n')

console.log(`export default {
  meta: {
    title: "${title}",
    description: "",
    version: "1.0.0",
    type: "${type}",
    tags: [],
    estimatedMinutes: 30,
    author: ""
  },
  component: ${componentName},
  gamification: {
    xp: 100,
    completionRule: "all-steps"
  }
}`)

console.log('\n// ─────────────────────────────────────────────────────────────────────────')
console.log('// Ricorda: le export SENSEI_TYPE e SENSEI_STEPS possono restare per')
console.log('// retrocompatibilità — non è necessario rimuoverle.')
console.log('// ─────────────────────────────────────────────────────────────────────────\n')
