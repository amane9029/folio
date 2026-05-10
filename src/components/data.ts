export const SEED_BOOKS: any[] = [];


const COVER_PALETTES = [
  { bg:'#1A1A1A', fg:'#EDEAE6', accent:'#9A9590' },
  { bg:'#2C2C2D', fg:'#E4E1DD', accent:'#A6A19C' },
  { bg:'#3D3A37', fg:'#E8E3DD', accent:'#B0AAA3' },
  { bg:'#4A4744', fg:'#EAE5DF', accent:'#B5AFA8' },
  { bg:'#5A5754', fg:'#EDE8E2', accent:'#BCB6AF' },
  { bg:'#6E6B68', fg:'#EFEAE4', accent:'#C2BCB5' },
  { bg:'#8A8682', fg:'#F2EDE7', accent:'#D2CDC6' },
  { bg:'#1F1D1C', fg:'#E2DFDB', accent:'#8E8983' },
  { bg:'#36332F', fg:'#E6E1DB', accent:'#A09A93' },
  { bg:'#272524', fg:'#E5E1DC', accent:'#9B958E' },
];

export function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function buildCoverSVG(title: string, author: string) {
  const h = hash(title + '|' + author);
  const pal = COVER_PALETTES[h % COVER_PALETTES.length];
  const variant = h % 3;
  const wrapTitle = (s: string, max = 14) => {
    const words = s.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > max) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = (line + ' ' + w).trim();
      }
    }
    if (line) lines.push(line);
    return lines.slice(0, 4);
  };
  const titleLines = wrapTitle(title.toUpperCase());
  const W = 320, H = 480;

  let art = '';
  if (variant === 0) {
    art = `
      <rect x="0" y="${H*0.62}" width="${W}" height="2" fill="${pal.fg}" opacity="0.5"/>
      <rect x="32" y="40" width="44" height="6" fill="${pal.accent}"/>
    `;
  } else if (variant === 1) {
    art = `
      <circle cx="${W/2}" cy="${H*0.42}" r="92" fill="none" stroke="${pal.accent}" stroke-width="1.5" opacity="0.7"/>
      <circle cx="${W/2}" cy="${H*0.42}" r="64" fill="none" stroke="${pal.fg}" stroke-width="1" opacity="0.5"/>
      <circle cx="${W/2}" cy="${H*0.42}" r="36" fill="${pal.accent}" opacity="0.55"/>
    `;
  } else {
    art = `
      <polygon points="0,${H*0.55} ${W},${H*0.32} ${W},${H*0.45} 0,${H*0.68}" fill="${pal.accent}" opacity="0.85"/>
      <rect x="32" y="40" width="44" height="6" fill="${pal.fg}"/>
    `;
  }

  const titleY = H * 0.74;
  const titleSVG = titleLines.map((line, i) =>
    `<text x="32" y="${titleY + i*30}" font-family="Lora, Georgia, serif" font-weight="600" font-size="26" fill="${pal.fg}" letter-spacing="0.5">${escapeXml(line)}</text>`
  ).join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <rect width="${W}" height="${H}" fill="${pal.bg}"/>
  ${art}
  ${titleSVG}
  <text x="32" y="${H - 32}" font-family="Inter, sans-serif" font-weight="500" font-size="13" fill="${pal.fg}" opacity="0.75" letter-spacing="1.5">${escapeXml(author.toUpperCase())}</text>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;' }[c] as string));
}

export function makeBook(seed: any, idx: number, uploadedBy = 'em.dawson@studio.fol', daysAgo = idx) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: 'b_' + (Date.now().toString(36)) + '_' + idx + '_' + hash(seed.title).toString(36),
    title: seed.title,
    author: seed.author,
    subfolder: seed.subfolder,
    cover: buildCoverSVG(seed.title, seed.author),
    fileSizeKb: 380 + (hash(seed.title) % 1800),
    uploadedAt: date.toISOString(),
    uploadedBy,
    _translateState: undefined,
    translation: undefined as any,
  };
}

const CONTRIBUTORS = [
  'reader@folio.app',
  'r.alvarez@folio.app',
  'k.tanaka@folio.app',
  'm.okonkwo@folio.app',
  's.lindqvist@folio.app',
];

const UPLOADER_FOR = (i: number) => {
  const pattern = [0,0,1,0,2,0,3,0,4,1,0,2,0,3,0,1,0,4,2,0,3,0,1,0,2,0,4,3];
  return CONTRIBUTORS[pattern[i % pattern.length]];
};

export const INITIAL_BOOKS: any[] = [];

export const DEMO_ACCOUNTS = [
  { email: 'reader@folio.app',     password: 'reader', role: 'user',  name: 'Em Dawson',  initials: 'ED' },
  { email: 'r.alvarez@folio.app',  password: 'admin',  role: 'admin', name: 'R. Alvarez', initials: 'RA' },
];

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtRelative = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000*60*60*24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 30) return Math.floor(days/7) + 'w ago';
  return fmtDate(iso);
};

export const fmtSize = (kb: number) => kb >= 1024 ? (kb/1024).toFixed(1) + ' MB' : kb + ' KB';

const NON_LATIN_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0590-\u06FF\u0900-\u097F\u0370-\u03FF\u0E00-\u0E7F]/;
export const needsTranslation = (s: string) => NON_LATIN_RE.test(s || '');
