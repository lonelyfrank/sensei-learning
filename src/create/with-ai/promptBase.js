// Prompt base invariabile — specifiche tecniche di Sensei per la generazione di sentieri
export const PROMPT_BASE = `Crea un sentiero interattivo in formato JSX per la piattaforma Sensei.

## Cos'è Sensei
Sensei è un'app desktop Electron che carica ed esegue artifact JSX come sentieri interattivi.
Un sentiero può essere qualsiasi tipo di percorso strutturato: un corso di studio, un progetto,
un percorso benessere, una formazione aziendale, un piano personale — qualsiasi cosa abbia
una progressione e un obiettivo.
I sentieri girano in un iframe sandboxed con React 18, Lucide React e Tailwind CSS già disponibili.
I progressi vengono salvati tramite window.storage, un'API asincrona key-value persistente.

## Specifiche tecniche obbligatorie

**Struttura del file:**
- Un singolo file .jsx
- Un componente React come export default
- Nessun import di librerie esterne oltre a react e lucide-react
- Tailwind CSS disponibile globalmente per lo styling
- Non usare: new Map(), new Set(), o altri costruttori JS nativi come variabili — 
  collidono con le icone Lucide dello stesso nome

**Storage dei progressi (OBBLIGATORIO):**
\`\`\`js
// Salva
await window.storage.set('chiave', JSON.stringify(valore))
// Leggi
const result = await window.storage.get('chiave')
const valore = result ? JSON.parse(result.value) : defaultValue
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
export default function NomeSentiero() { ... }
\`\`\`

## Struttura contenuto
Il sentiero deve avere una vista panoramica e una vista dettaglio per ogni step.
Ogni step deve avere almeno:
- Titolo e obiettivo chiaro
- Contenuto principale (teoria, istruzioni, piano, esercizi — dipende dal tipo)
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
- Possibilità di tornare alla panoramica`