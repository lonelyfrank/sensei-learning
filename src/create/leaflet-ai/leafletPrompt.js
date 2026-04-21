// Prompt base — specifiche tecniche di Sensei per la generazione di LEAFLET
// Un leaflet è un documento consultabile: ricetta, guida, scheda tecnica, minicorso su singolo argomento

export const LEAFLET_PROMPT_BASE = `Crea un leaflet interattivo in formato JSX per la piattaforma Sensei.

## Cos'è Sensei
Sensei è un'app desktop Electron che carica ed esegue artifact JSX interattivi.
Un leaflet è un documento consultabile e autonomo: una ricetta, una guida di configurazione,
una scheda tecnica, un minicorso su un singolo concetto, una procedura step-by-step.
A differenza di un sentiero, il leaflet non si protrae nel tempo — è pensato per essere
consultato, eseguito o seguito in una singola sessione, e tenuto come riferimento.
I leaflet girano in un iframe sandboxed con React 18, Lucide React e Tailwind CSS già disponibili.
I progressi opzionali vengono salvati tramite window.storage, un'API asincrona key-value persistente.

## Variabili di identificazione (OBBLIGATORIE — prime righe del file)
\`\`\`js
export const SENSEI_TYPE = 'leaflet'
export const SENSEI_STEPS = 8 // numero di passi/sezioni, 0 se nessuno
\`\`\`
Queste variabili permettono a Sensei di identificare automaticamente il tipo di artifact
e il numero di passi senza ambiguità, anche senza memoria condivisa.

## Specifiche tecniche obbligatorie

**Struttura del file:**
- Un singolo file .jsx
- Le variabili SENSEI_TYPE e SENSEI_STEPS come prime righe dopo gli import
- Un componente React come export default
- Nessun import di librerie esterne oltre a react e lucide-react
- Tailwind CSS disponibile globalmente per lo styling
- Non usare: new Map(), new Set(), o altri costruttori JS nativi come variabili —
  collidono con le icone Lucide dello stesso nome

**Array dei passi (se il leaflet ha step da seguire):**
\`\`\`js
const STEPS = [
  { id: 1, title: '...', ... },
  { id: 2, title: '...', ... },
  // id numerici progressivi, partendo da 1
  // per ricette: ingredienti + passi separati
  // per guide: sezioni logiche
]
\`\`\`

**Storage (OPZIONALE — solo se ha senso segnare passi come completati):**
\`\`\`js
// Salva
await window.storage.set('completed', JSON.stringify(completed))
// Leggi
const result = await window.storage.get('completed')
const completed = result ? JSON.parse(result.value) : {}
\`\`\`
La chiave 'completed' deve contenere un oggetto con chiavi numeriche e valori booleani:
{ "1": true, "2": false, ... }
Per leaflet puramente consultabili (es. schede tecniche, reference) lo storage non è necessario.

**Pattern import:**
\`\`\`jsx
import React, { useState, useEffect } from 'react'
import { NomeIcona } from 'lucide-react'
\`\`\`

**Export:**
\`\`\`jsx
export const SENSEI_TYPE = 'leaflet'
export const SENSEI_STEPS = N
export default function NomeLeaflet() { ... }
\`\`\`

## Struttura contenuto
Il leaflet deve essere immediatamente consultabile e chiaro.
A differenza del sentiero, non serve una navigazione complessa — il contenuto
deve essere accessibile con il minimo attrito possibile.

Linee guida per tipo:
- **Ricetta**: sezione ingredienti + sezione procedura con passi numerati, possibilità di segnare i passi come fatti
- **Guida/configurazione**: sezioni logiche con istruzioni chiare, codice se necessario, note e avvertenze
- **Scheda tecnica/reference**: layout a colonne o tabellare, ricerca o filtro se molte voci, sempre tutto visibile
- **Minicorso singolo argomento**: struttura compatta con teoria + esempio + esercizio in un'unica vista

## Design
Crea un design unico e originale coerente con il tipo e l'argomento del leaflet.
Il leaflet deve essere visivamente distintivo e immediatamente leggibile.
Privilegia la chiarezza e la scansionabilità rispetto alla progressione narrativa.
Può avere un tema fisso (dark o light) coerente con il contenuto.

## UX e navigazione
- Tutto il contenuto deve essere accessibile senza navigazione complessa
- Se ha sezioni/passi: usa tab, accordion o scroll verticale — non pagine separate
- Evidenzia le informazioni chiave visivamente (highlight, badge, icone)
- Se ha step completabili: checkbox o bottone discreto per segnare ogni passo
- Niente back/forward obbligatori — il leaflet è un documento, non un corso`