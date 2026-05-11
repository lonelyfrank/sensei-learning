# Sicurezza / Security

## Italiano

### Modello di sicurezza degli artifact

Sensei Learning esegue i corsi come componenti React (artifact JSX) all'interno di un `<iframe>` con sandbox `allow-scripts allow-same-origin`. Questo significa che il codice dell'artifact gira in un contesto isolato ma con accesso limitato all'ambiente Electron.

**Cosa è consentito agli artifact:**
- Usare React e lucide-react (forniti dall'host via UMD bundle)
- Salvare/leggere dati di progresso tramite il bridge `window.storage` (IPC → SQLite)
- Accedere alle API Web standard disponibili nel browser Chromium embedded

**Cosa non è consentito:**
- Import di librerie esterne (bloccato dal validatore prima del salvataggio)
- Accesso diretto al filesystem o alle API Electron (non esposti nell'iframe)
- `new Map()` / `new Set()` con nomi che collidono con icone Lucide (bloccato dal validatore)

**Comunicazione iframe ↔ host:**
- Tutti i messaggi `postMessage` sono validati per origine (`http://localhost:5173` in dev, `file://` in prod) e struttura prima di essere processati.
- Il bridge storage usa ID univoci per abbinare richieste e risposte.

### Chiavi API

Le chiavi API (Anthropic) sono memorizzate in `app.getPath('userData')` tramite Electron — mai nella directory del progetto e mai nel repository git. Il file `.gitignore` esclude esplicitamente `*.key`, `*.enc` e `.env`.

### Segnalare una vulnerabilità

Per segnalare una vulnerabilità di sicurezza, apri una [GitHub Issue](../../issues) con il tag `security` oppure contatta direttamente il maintainer. Non pubblicare dettagli sensibili in pubblico prima di una fix concordata.

---

## English

### Artifact security model

Sensei Learning runs courses as React components (JSX artifacts) inside an `<iframe>` with `allow-scripts allow-same-origin` sandbox. The artifact code runs in an isolated context with limited access to the Electron environment.

**What artifacts are allowed to do:**
- Use React and lucide-react (provided by the host via UMD bundle)
- Save/read progress data via the `window.storage` bridge (IPC → SQLite)
- Access standard Web APIs available in the embedded Chromium browser

**What artifacts cannot do:**
- Import external libraries (blocked by the validator before saving)
- Access the filesystem or Electron APIs directly (not exposed inside the iframe)
- Use `new Map()` / `new Set()` with names that collide with Lucide icons (blocked by the validator)

**iframe ↔ host communication:**
- All `postMessage` messages are validated for origin (`http://localhost:5173` in dev, `file://` in prod) and structure before processing.
- The storage bridge uses unique IDs to match requests with responses.

### API keys

API keys (Anthropic) are stored in `app.getPath('userData')` via Electron — never inside the project directory and never committed to the git repository. The `.gitignore` explicitly excludes `*.key`, `*.enc`, and `.env`.

### Reporting a vulnerability

To report a security vulnerability, open a [GitHub Issue](../../issues) with the `security` tag or contact the maintainer directly. Please do not disclose sensitive details publicly before an agreed fix is in place.
