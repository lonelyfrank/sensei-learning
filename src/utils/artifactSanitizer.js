export function sanitizeArtifact(content) {
  let s = content

  // Rimuove BOM e caratteri invisibili all'inizio
  s = s.replace(/^[\ufeff\u200b\u200c\u200d\u2060\ufffe]+/, '')

  // Normalizza line endings
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Strip markdown fences (```jsx, ```js, ```, ecc.)
  const fenceStart = s.indexOf('```')
  if (fenceStart !== -1) {
    const afterLang = s.indexOf('\n', fenceStart)
    if (afterLang !== -1) {
      const lastFence = s.lastIndexOf('\n```')
      if (lastFence > afterLang) {
        s = s.slice(afterLang + 1, lastFence)
      }
    }
  }

  // Normalizza virgolette curve → dritte
  // Le AI a volte usano ' ' come delimitatori di stringa, rompendo il parsing JS
  s = s.replace(/[‘’]/g, "'")
  s = s.replace(/[“”]/g, '"')

  return s.trim()
}
