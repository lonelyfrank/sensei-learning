// Prompt base — specifiche tecniche di Sensei per la generazione di SENTIERI
// Un sentiero è un percorso progressivo che si protrae nel tempo (corsi, programmi, progetti, formazione)

export const SENTIERO_PROMPT_BASE = `IMPORTANTE: Restituisci ESCLUSIVAMENTE il codice JSX grezzo.
Nessun backtick, nessun \`\`\`jsx, nessun testo prima o dopo. Solo il codice, da riga 1.

Crea un sentiero interattivo in formato JSX per la piattaforma Sensei.

## Cos'è Sensei
Sensei è un'app desktop Electron che carica ed esegue artifact JSX interattivi.
Un sentiero è un percorso strutturato che si protrae nel tempo: un corso di studio, un progetto,
un percorso benessere, una formazione aziendale, un programma di allenamento — qualsiasi cosa
abbia una progressione, obiettivi a lungo termine e step da completare giorno per giorno.
I sentieri girano in un iframe sandboxed con React 18, Lucide React e Tailwind CSS già disponibili.
I progressi vengono salvati tramite window.storage, un'API asincrona key-value persistente.

## Variabili di identificazione (OBBLIGATORIE — prime righe dopo gli import)
\`\`\`js
export const SENSEI_TYPE = 'sentiero'
export const SENSEI_STEPS = 30 // sostituisci con il numero esatto di step
\`\`\`
Queste variabili permettono a Sensei di identificare automaticamente il tipo di artifact
e il numero di step. Devono essere presenti come export const, esattamente così.

## Struttura del file (RISPETTA QUESTO ORDINE)
\`\`\`jsx
import React, { useState, useEffect, useMemo } from 'react'
import { NomeIcona, AltraIcona } from 'lucide-react'

export const SENSEI_TYPE = 'sentiero'
export const SENSEI_STEPS = N

export default function NomeSentiero() {
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

## Array degli step (OBBLIGATORIO)
\`\`\`js
const STEPS = [
  { id: 1, title: '...', ... },
  { id: 2, title: '...', ... },
  // id numerici interi progressivi partendo da 1
]
\`\`\`
Il numero di oggetti in STEPS deve corrispondere esattamente al valore di SENSEI_STEPS.

## Storage dei progressi (OBBLIGATORIO)
\`\`\`js
// Leggi — result.value è una stringa JSON, non l'oggetto direttamente
const result = await window.storage.get('completed')
const completed = result ? JSON.parse(result.value) : {}

// Scrivi
await window.storage.set('completed', JSON.stringify(completed))
\`\`\`
La chiave 'completed' deve contenere un oggetto con chiavi numeriche stringa e valori booleani:
{ "1": true, "2": false, "3": true, ... }
Questo formato permette a Sensei di tracciare il progresso e mostrare il completamento globale.

## Struttura contenuto
Il sentiero deve avere una vista panoramica e una vista dettaglio per ogni step.
Ogni step deve avere almeno:
- Titolo e obiettivo chiaro
- Contenuto principale (teoria, istruzioni, piano, fonti, esercizi — dipende dal tipo)
- Azione concreta da compiere
- Bottone per segnare lo step come completato (aggiorna lo storage)

## Design
Crea un design unico e originale coerente con il tema e il tipo del sentiero.
Usa colori, tipografia e layout che riflettano la natura del contenuto.
Il sentiero deve essere visivamente distintivo — niente template generici.
Può avere un tema fisso (dark o light) coerente con il contenuto.

## Navigazione
- Vista panoramica con tutti gli step e il progresso complessivo
- Vista dettaglio per ogni step con bottone "Completa"
- Possibilità di tornare alla panoramica
- Indicatore visivo del progresso globale (barra, percentuale, o step X/N)`
