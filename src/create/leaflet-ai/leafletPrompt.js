// Prompt base — specifiche tecniche di Sensei per la generazione di LEAFLET
// Un leaflet è un documento consultabile: ricetta, guida, scheda tecnica, minicorso su singolo argomento

export const LEAFLET_PROMPT_BASE = `IMPORTANTE: Restituisci ESCLUSIVAMENTE il codice JSX grezzo.
Nessun backtick, nessun \`\`\`jsx, nessun testo prima o dopo. Solo il codice, da riga 1.

Crea un leaflet interattivo in formato JSX per la piattaforma Sensei.

## Cos'è Sensei
Sensei è un'app desktop Electron che carica ed esegue artifact JSX interattivi.
Un leaflet è un documento consultabile e autonomo: una ricetta, una guida di configurazione,
una scheda tecnica, un minicorso su un singolo concetto, una procedura step-by-step.
A differenza di un sentiero, il leaflet non si protrae nel tempo — è pensato per essere
consultato, eseguito o seguito in una singola sessione, e tenuto come riferimento.
I leaflet girano in un iframe sandboxed con React 18, Lucide React e Tailwind CSS già disponibili.
I progressi opzionali vengono salvati tramite window.storage, un'API asincrona key-value persistente.

## Variabili di identificazione (OBBLIGATORIE — prime righe dopo gli import)
\`\`\`js
export const SENSEI_TYPE = 'leaflet'
export const SENSEI_STEPS = 8 // numero di passi/sezioni, 0 se nessuno
\`\`\`
Queste variabili permettono a Sensei di identificare automaticamente il tipo di artifact
e il numero di passi. Devono essere presenti come export const, esattamente così.

## Struttura del file (RISPETTA QUESTO ORDINE)
\`\`\`jsx
import React, { useState, useEffect } from 'react'
import { NomeIcona, AltraIcona } from 'lucide-react'

export const SENSEI_TYPE = 'leaflet'
export const SENSEI_STEPS = N

export default function NomeLeaflet() {
  // ...
}
\`\`\`

Regole strutturali:
- Un singolo componente come export default — uno solo, sempre presente
- Nessun import di librerie esterne oltre a react e lucide-react
- Tailwind CSS disponibile globalmente per lo styling (nessun import)

**Stringhe con apostrofi — CRITICO:** usa sempre doppie virgolette per TUTTI i valori stringa nelle strutture dati: title, description, tip, note, ecc. NON usare virgolette singole — le parole italiane contengono apostrofi (d'acqua, l'impasto, l'utente) che spezzano le stringhe con virgoletta singola causando errori di parsing.

  SBAGLIATO:  { description: 'scalda l\\'acqua'  }  // l'apostrofo chiude la stringa — ERRORE
  CORRETTO:   { description: "scalda l'acqua"   }  // doppie virgolette, nessun conflitto

## Icone Lucide — nomi vietati
Sensei rinomina automaticamente le icone Lucide che collidono con costruttori JavaScript.
NON importare né usare icone con questi nomi: Map, Set, Array, Object, Error, Event, URL, Image.
Se Lucide ha un'icona con quel nome, usa un'alternativa (es. MapPin invece di Map, AlertCircle invece di Error).

## Array dei passi (se il leaflet ha step da seguire)
\`\`\`js
const STEPS = [
  { id: 1, title: '...', ... },
  { id: 2, title: '...', ... },
  // id numerici interi progressivi partendo da 1
  // per ricette: ingredienti + passi separati
  // per guide: sezioni logiche
]
\`\`\`
Il numero di oggetti in STEPS deve corrispondere al valore di SENSEI_STEPS (se > 0).

## Storage (OPZIONALE — solo se ha senso segnare passi come completati)
\`\`\`js
// Leggi — result.value è una stringa JSON, non l'oggetto direttamente
const result = await window.storage.get('completed')
const completed = result ? JSON.parse(result.value) : {}

// Scrivi
await window.storage.set('completed', JSON.stringify(completed))
\`\`\`
La chiave 'completed' deve contenere un oggetto con chiavi numeriche stringa e valori booleani:
{ "1": true, "2": false, ... }
Per leaflet puramente consultabili (schede tecniche, reference) lo storage non è necessario —
in quel caso usa SENSEI_STEPS = 0.

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