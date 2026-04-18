const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

// Il database viene salvato nella cartella dati dell'app
// Su Linux: ~/.config/sensei-learning/sensei.db
// Su Windows: %APPDATA%/sensei-learning/sensei.db
// Su Mac: ~/Library/Application Support/sensei-learning/sensei.db
const dbPath = path.join(app.getPath('userData'), 'sensei.db')

const db = new Database(dbPath)

// Crea le tabelle se non esistono ancora
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    added_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    day_id INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at INTEGER,
    UNIQUE(course_id, day_id)
  );
`)

module.exports = db