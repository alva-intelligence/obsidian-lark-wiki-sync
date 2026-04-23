export function sanitizeFileName(title: string): string {
  return title.trim().replace(/[/:\\]/g, '-');
}

export function unixToISO(unixStr: string): string {
  return new Date(parseInt(unixStr) * 1000).toISOString();
}

export function isCLAUDEMD(title: string): boolean {
  return title.trim() === 'CLAUDE.md';
}

export function isSkillDoc(title: string): boolean {
  return title.trim().toLowerCase().startsWith('skill:');
}

export function skillFileName(title: string): string {
  return title.trim().slice('skill:'.length).trim() + '.md';
}

export function buildRelativePath(parentRelDir: string, title: string): string {
  const safeName = sanitizeFileName(title) + '.md';
  return parentRelDir ? `${parentRelDir}/${safeName}` : safeName;
}
