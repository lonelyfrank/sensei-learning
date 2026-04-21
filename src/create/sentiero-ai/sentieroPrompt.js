// Prompt base — specifiche tecniche di Sensei per la generazione di SENTIERI
// Un sentiero è un percorso progressivo che si protrae nel tempo (corsi, programmi, progetti, formazione)

export const SENTIERO_PROMPT_BASE = `Crea un sentiero interattivo in formato JSX per la piattaforma Sensei.

## Cos'è Sensei
Sensei è un'app desktop Electron che carica ed esegue artifact JSX interattivi.
Un sentiero è un percorso strutturato che si protrae nel tempo: un corso di studio, un progetto,
un percorso benessere, una formazione aziendale, un programma di allenamento — qualsiasi cosa
abbia una progressione, obiettivi a lungo termine e step da completare giorno per giorno.
I sentieri girano in un iframe sandboxed con React 18, Lucide React e Tailwind CSS già disponibili.
I progressi vengono salvati tramite window.storage, un'API asincrona key-value persistente.

## Variabili di identificazione (OBBLIGATORIE — prime righe del file)
\`\`\`js
export const SENSEI_TYPE = 'sentiero'
export const SENSEI_STEPS = 30 // sostituisci con il numero esatto di step
\`\`\`
Queste variabili permettono a Sensei di identificare automaticamente il tipo di artifact
e il numero di step senza ambiguità, anche senza memoria condivisa.

## Specifiche tecniche obbligatorie

**Struttura del file:**
- Un singolo file .jsx
- Le variabili SENSEI_TYPE e SENSEI_STEPS come prime righe dopo gli import
- Un componente React come export default
- Nessun import di librerie esterne oltre a react e lucide-react
- Tailwind CSS disponibile globalmente per lo styling
- Non usare: new Map(), new Set(), o altri costruttori JS nativi come variabili —
  collidono con le icone Lucide dello stesso nome

**Array degli step (OBBLIGATORIO):**
\`\`\`js
const STEPS = [
  { id: 1, title: '...', ... },
  { id: 2, title: '...', ... },
  // id numerici progressivi, partendo da 1
]
\`\`\`

**Storage dei progressi (OBBLIGATORIO):**
\`\`\`js
// Salva
await window.storage.set('completed', JSON.stringify(completed))
// Leggi
const result = await window.storage.get('completed')
const completed = result ? JSON.parse(result.value) : {}
\`\`\`
La chiave 'completed' deve contenere un oggetto con chiavi numeriche e valori booleani:
{ "1": true, "2": false, ... } — questo permette a Sensei di tracciare il progresso automaticamente.

**Pattern import:**
\`\`\`jsx
import React, { useState, useEffect, useMemo } from 'react'
import { NomeIcona } from 'lucide-react'
\`\`\`

**Export:**
\`\`\`jsx
export const SENSEI_TYPE = 'sentiero'
export const SENSEI_STEPS = N
export default function NomeSentiero() { ... }
\`\`\`

## Struttura contenuto
Il sentiero deve avere una vista panoramica e una vista dettaglio per ogni step.
Ogni step deve avere almeno:
- Titolo e obiettivo chiaro
- Contenuto principale (teoria, istruzioni, piano, fonti, esercizi — dipende dal tipo)
- Azione concreta da compiere
- Modo per segnare lo step come completato

## Design
Crea un design unico e originale coerente con il tema e il tipo del sentiero.
Usa colori, tipografia e layout che riflettano la natura del contenuto.
Il sentiero deve essere visivamente distintivo — niente template generici.
Può avere un tema fisso (dark o light) coerente con il contenuto.

## Navigazione
- Vista panoramica con tutti gli step e il progresso complessivo
- Vista dettaglio per ogni step
- Bottone per segnare ogni step come completato
- Possibilità di tornare alla panoramica
- Indicatore visivo del progresso globale (es. barra, percentuale, step X/N)`