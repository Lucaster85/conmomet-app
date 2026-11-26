import { Fragment } from 'react';

/** Texto con `**negrita**` como único marcado: evita `dangerouslySetInnerHTML` en contenido editable. */
export default function RichText({ children }: { children: string }) {
  return (
    <>
      {children.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-pub-navy">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
