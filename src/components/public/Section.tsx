import type { ReactNode } from 'react';

interface SectionProps {
  /** Ancla de navegación (#nosotros, #servicios…). */
  id?: string;
  /** Texto chico en mayúsculas con el guioncito delante: la firma visual del sistema. */
  eyebrow: string;
  title: ReactNode;
  /** Fondo de la sección, para alternar el ritmo (ej. `bg-white/50`). */
  className?: string;
  children?: ReactNode;
}

/** Wrapper canónico de cada sección de la web pública. Server component. */
export default function Section({ id, eyebrow, title, className = '', children }: SectionProps) {
  return (
    <section id={id} className={`px-5 py-16 md:px-8 md:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-pub-brand-deep">
          <span aria-hidden="true" className="h-px w-6 bg-pub-brand" />
          {eyebrow}
        </p>
        <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-pub-navy md:text-5xl">
          {title}
        </h2>
        {children !== undefined && <div className="mt-10 md:mt-14">{children}</div>}
      </div>
    </section>
  );
}
