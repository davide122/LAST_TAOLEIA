'use client';

export default function ClickableCategory({ children, onCategoryClick }) {
  if (typeof children !== 'string') return <>{children}</>;

  const text = children;
  const parts = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let last = 0;
  let match;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const label = (match[1] || '').trim();
    if (start > last) {
      parts.push({ type: 'text', content: text.slice(last, start) });
    }
    if (label) {
      parts.push({ type: 'overlay', content: label });
    } else {
      parts.push({ type: 'text', content: text.slice(start, end) });
    }
    last = end;
  }

  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) });
  }

  const hasOverlay = parts.some(p => p.type === 'overlay');
  if (!hasOverlay) return <>{children}</>;

  return (
    <>
      {parts.map((p, i) =>
        p.type === 'overlay' ? (
          <span
            key={i}
            className="category-highlight"
            onClick={() => onCategoryClick(`${p.content}`)}
          >
            {p.content}
          </span>
        ) : (
          <span key={i}>{p.content}</span>
        )
      )}
    </>
  );
}
