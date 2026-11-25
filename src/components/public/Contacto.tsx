import { getEnvironmentConfig } from '../../config/environment';
import ContactForm from './ContactForm';
import { MailIcon, PhoneIcon, WhatsAppIcon } from './icons';
import Reveal from './Reveal';

const CHANNEL_CLASS =
  'flex min-h-12 items-center gap-3 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-pub-action hover:text-pub-action';

// Sección de cierre de la landing (#contacto): reemplaza al modal. Server component; el único
// cliente es el formulario.
export default function Contacto() {
  const { legalName } = getEnvironmentConfig();

  return (
    <section
      id="contacto"
      className="relative isolate overflow-hidden rounded-t-[2rem] bg-pub-navy px-5 py-16 text-white md:px-8 md:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 -z-10 size-[28rem] rounded-full bg-pub-brand/20 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-pub-action">
            <span aria-hidden="true" className="h-px w-6 bg-pub-action" />
            Hablemos
          </p>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight md:text-5xl">Contactanos</h2>
          <p className="mt-5 max-w-md leading-relaxed text-white/70">
            Completá el formulario y te respondemos a la brevedad. También podés escribirle a {legalName}{' '}
            directamente:
          </p>
          <ul className="mt-8 flex flex-col items-start gap-3">
            <li>
              <a href="https://wa.me/5492262679570" target="_blank" rel="noopener noreferrer" className={CHANNEL_CLASS}>
                <WhatsAppIcon /> WhatsApp +54 9 2262 679570
              </a>
            </li>
            <li>
              <a href="tel:+542262679570" className={CHANNEL_CLASS}>
                <PhoneIcon /> Cotizaciones (2262) 679570
              </a>
            </li>
            <li>
              <a href="tel:+542262610787" className={CHANNEL_CLASS}>
                <PhoneIcon /> Administración (2262) 610787
              </a>
            </li>
            <li>
              <a href="mailto:montajes@conmomet.com.ar" className={CHANNEL_CLASS}>
                <MailIcon /> montajes@conmomet.com.ar
              </a>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="rounded-3xl bg-white p-6 text-pub-navy shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] md:p-8">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
