interface TextElementStyle {
  bold?: boolean;
  italic?: boolean;
  inline_code?: boolean;
  strikethrough?: boolean;
}

interface TextRun {
  content: string;
  text_element_style?: TextElementStyle;
}

interface Element {
  text_run?: TextRun;
  mention_doc?: { title: string };
  mention_user?: { name: string };
}

interface BlockContent {
  elements?: Element[];
}

export interface LarkBlock {
  block_id: string;
  block_type: number;
  parent_id: string;
  children?: string[];
  page?: BlockContent;
  text?: BlockContent;
  heading1?: BlockContent;
  heading2?: BlockContent;
  heading3?: BlockContent;
  heading4?: BlockContent;
  heading5?: BlockContent;
  heading6?: BlockContent;
  bullet?: BlockContent;
  ordered?: BlockContent;
  code?: BlockContent & { style?: { language?: number } };
  quote?: BlockContent;
  todo?: BlockContent & { style?: { done?: boolean } };
}

const CONTENT_KEY: Record<number, string> = {
  1: 'page', 2: 'text',
  3: 'heading1', 4: 'heading2', 5: 'heading3',
  6: 'heading4', 7: 'heading5', 8: 'heading6',
  12: 'bullet', 13: 'ordered', 14: 'code',
  15: 'quote', 16: 'todo',
};

const HEADING_PREFIX: Record<number, string> = {
  3: '# ', 4: '## ', 5: '### ',
  6: '#### ', 7: '##### ', 8: '###### ',
};

function wrap(t: string, marker: string): string {
  // Preserve leading/trailing whitespace outside the marker
  return t.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, pre, mid, post) =>
    mid ? `${pre}${marker}${mid}${marker}${post}` : t
  );
}

function renderElements(elements: Element[], skipStyles = false): string {
  return elements.map(el => {
    if (el.mention_doc) return `[${el.mention_doc.title}]`;
    if (el.mention_user) return `@${el.mention_user.name}`;
    if (!el.text_run?.content) return '';
    let t = el.text_run.content;
    if (skipStyles) return t;
    const s = el.text_run.text_element_style;
    if (s?.bold) t = wrap(t, '**');
    if (s?.italic) t = wrap(t, '*');
    if (s?.inline_code) t = `\`${t}\``;
    if (s?.strikethrough) t = wrap(t, '~~');
    return t;
  }).join('');
}

export function blocksToMarkdown(blocks: LarkBlock[]): string {
  const map = new Map<string, LarkBlock>();
  for (const b of blocks) map.set(b.block_id, b);

  const root = blocks.find(b => b.block_type === 1 && !b.parent_id);
  if (!root) return '';

  const lines: string[] = [];

  function walk(id: string, indent: number): void {
    const b = map.get(id);
    if (!b) return;
    const t = b.block_type;

    // Skip add-ons (ToC, tables for now), images handled as placeholder
    if (t >= 17 && t <= 19) { if (t === 17) lines.push('---'); return; }
    if (t >= 20) return;

    const key = CONTENT_KEY[t];
    const content = key ? (b as any)[key] as BlockContent | undefined : undefined;
    const text = renderElements(content?.elements ?? []);
    const pad = '  '.repeat(indent);

    if (t === 1) {
      // Page root: title as H1
      if (text.trim()) lines.push(`# ${text.trim()}`);
      for (const cid of b.children ?? []) walk(cid, 0);
      return;
    }

    if (t === 2) {
      lines.push(text.trim() ? `${pad}${text}` : '');
    } else if (HEADING_PREFIX[t]) {
      // Skip bold/italic inside headings — headings are inherently emphasized
      const headingText = renderElements(content?.elements ?? [], true).trim();
      lines.push(`${pad}${HEADING_PREFIX[t]}${headingText}`);
    } else if (t === 12) {
      lines.push(`${pad}- ${text}`);
    } else if (t === 13) {
      lines.push(`${pad}1. ${text}`);
    } else if (t === 14) {
      lines.push(`\`\`\`\n${text}\n\`\`\``);
    } else if (t === 15) {
      lines.push(`${pad}> ${text}`);
    } else if (t === 16) {
      const done = (b as any).todo?.style?.done ? 'x' : ' ';
      lines.push(`${pad}- [${done}] ${text}`);
    }

    const listBlock = t === 12 || t === 13;
    for (const cid of b.children ?? []) walk(cid, listBlock ? indent + 1 : indent);
  }

  walk(root.block_id, 0);

  // Collapse 3+ consecutive blank lines to 2
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
