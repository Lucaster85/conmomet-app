import { Fragment } from 'react';

/**
 * Texto con `**resaltado**` como único marcado: evita `dangerouslySetInnerHTML` en contenido editable.
 * Lo resaltado sale en negrita y con `highlightClassName` (por defecto, el azul oscuro de los titulares).
 */
export default function RichText({
  children,
  highlightClassName = 'text-pub-navy',
}: {
  children: string;
  highlightClassName?: string;
}) {
  return (
    <>
      {children.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={highlightClassName}>
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
