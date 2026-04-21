const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

// Il database viene salvato nella cartella dati dell'app
// Su Linux: ~/.config/sensei-learning/sensei.db
// Su Windows: %APPDATA%/sensei-learning/sensei.db
// Su Mac: ~/Library/Application Support/sensei-learning/sensei.db
const dbPath = path.join(app.getPath('userData'), 'sensei.db')
const db = new Database(dbPath)

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

db.exec(`
  -- Sentieri e leaflet importati dall'utente
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    total_days INTEGER DEFAULT 0,
    icon TEXT DEFAULT 'BookOpen',
    color TEXT DEFAULT '#378ADD',
    added_at INTEGER DEFAULT (strftime('%s', 'now')),
    -- Tipo di artifact: 'sentiero' (percorso progressivo) o 'leaflet' (documento consultabile)
    type TEXT DEFAULT 'sentiero'
  );

  -- Progressi per ogni step di ogni sentiero/leaflet
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    day_id INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at INTEGER,
    UNIQUE(course_id, day_id)
  );

  -- Storage chiave-valore per ogni sentiero/leaflet (usato dagli artifact JSX)
  CREATE TABLE IF NOT EXISTS course_storage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(course_id, key)
  );

  -- Profilo utente (singolo utente locale)
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT DEFAULT 'Utente',
    avatar TEXT DEFAULT NULL
  );

  INSERT OR IGNORE INTO user (id, name) VALUES (1, 'Utente');
`)

// ─── MIGRAZIONI ───────────────────────────────────────────────────────────────
// Aggiunge colonne mancanti ai DB esistenti senza perdere dati.
// Ogni migrazione è protetta da un try/catch — se la colonna esiste già, viene ignorata.

const migrations = [
  // v1.1 — aggiunge il tipo di artifact (sentiero/leaflet)
  `ALTER TABLE courses ADD COLUMN type TEXT DEFAULT 'sentiero'`,
]

for (const migration of migrations) {
  try {
    db.exec(migration)
  } catch (e) {
    // Colonna già esistente — ignora
  }
}

module.exports = db