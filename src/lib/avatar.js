export function deviceInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?'
}

// Auto-generated avatar from name initials (data URI so nothing is fetched).
export function initialsAvatar(name) {
  const initials = deviceInitials(name)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#181c22"/><text x="32" y="41" font-family="Space Mono, monospace" font-size="24" font-weight="700" fill="#00dbe9" text-anchor="middle">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}