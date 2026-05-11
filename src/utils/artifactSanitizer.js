export function sanitizeArtifact(content) {
  let s = content

  s = s.replace(/^[﻿​‌‍⁠￾]+/, '')
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Strip markdown fences — sicuro per entrambi i formati (legacy e Sensei Artifact Standard):
  // il contenuto dell'oggetto export default { ... } non inizia mai con ``` su riga isolata.
  const isNewFormat = /export\s+default\s+\{/.test(s) && /\bcomponent\s*:/.test(s)
  if (!isNewFormat) {
    const fenceStart = s.indexOf('```')
    if (fenceStart !== -1) {
      const afterLang = s.indexOf('\n', fenceStart)
      if (afterLang !== -1) {
        const lastFence = s.lastIndexOf('\n```')
        if (lastFence > afterLang) s = s.slice(afterLang + 1, lastFence)
      }
    }
  }

  s = s.replace(/['']/g, "'")
  s = s.replace(/[""]/g, '"')

  return s.trim()
}
