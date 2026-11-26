import { BLOCK_ANCHORS } from '../../../config/landing';
import ContactForm from '../ContactForm';
import PublicLink from '../PublicLink';
import Reveal from '../Reveal';
import type { BlockProps } from './types';

const CHANNEL_CLASS =
  'flex min-h-12 items-center gap-3 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-pub-action hover:text-pub-action';

// Sección de cierre de la landing (#contacto). Server component; el único cliente es el formulario.
// Los canales salen de `footer.contact`, los mismos que dibuja el pie, así un teléfono se cambia en un
// solo lado. Las direcciones quedan solo en el pie (acá serían un botón-píldora que abre un mapa).
export default function ContactBlock({ block, manifest }: BlockProps<'contact'>) {
  const { eyebrow, title, subtitle } = block.content;
  const channels = manifest.footer.contact.filter((link) => link.kind !== 'address');

  return (
    <section
      id={BLOCK_ANCHORS.contact}
      className="relative isolate overflow-hidden rounded-t-[2rem] bg-pub-navy px-5 py-16 text-white md:px-8 md:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 -z-10 size-[28rem] rounded-full bg-pub-brand/20 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          {eyebrow && (
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-pub-action">
              <span aria-hidden="true" className="h-px w-6 bg-pub-action" />
              {eyebrow}
            </p>
          )}
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight md:text-5xl">{title}</h2>
          {subtitle && <p className="mt-5 max-w-md leading-relaxed text-white/70">{subtitle}</p>}
          {channels.length > 0 && (
            <ul className="mt-8 flex flex-col items-start gap-3">
              {channels.map((link) => (
                <li key={`${link.kind}-${link.value}`}>
                  <PublicLink link={link} className={CHANNEL_CLASS} />
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal delay={0.1} className="rounded-3xl bg-white p-6 text-pub-navy shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] md:p-8">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
