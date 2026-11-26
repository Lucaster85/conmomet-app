import { getEnvironmentConfig } from '../../config/environment';
import type { LandingFooter, LandingLink } from '../../config/landing';
import PublicLink from './PublicLink';

const LINK_CLASS = 'flex items-center gap-2.5 text-white/65 transition-colors hover:text-white';
const ICON_CLASS = 'shrink-0 text-pub-action';

function LinkColumn({ title, links }: { title: string; links: LandingLink[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${link.kind}-${link.value}-${link.label}`}>
            <PublicLink link={link} className={LINK_CLASS} iconClassName={ICON_CLASS} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Pie de la web pública. Todo lo que dice (descripción, contacto, enlaces) viene del manifiesto de la
// marca (FLOWS.md §86). El enlace a "Trabajá con nosotros" es un enlace más del manifiesto: la Ayuda
// (postulantes.md) dice que está en el menú de arriba, en el del celular y en el pie.
export default function PublicFooter({ footer }: { footer: LandingFooter }) {
  const { appName, legalName } = getEnvironmentConfig();

  return (
    <footer className="border-t border-white/10 bg-pub-navy px-5 pt-16 pb-24 text-white md:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[auto_1fr] md:gap-16">
          {/* El logo va sobre una pastilla clara: así no hace falta invertirlo con filter */}
          <div>
            <div className="inline-block rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-landing.svg" alt={appName} className="h-16 w-auto md:h-20" />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight">{legalName}</h3>
              {footer.description && <p className="mt-4 leading-relaxed text-white/65">{footer.description}</p>}
            </div>
            <LinkColumn title="Contacto" links={footer.contact} />
            <LinkColumn title="Enlaces rápidos" links={footer.links} />
          </div>
        </div>

        <p className="mt-12 border-t border-white/15 pt-6 text-center text-sm text-white/65">
          © {new Date().getFullYear()} {legalName} Todos los derechos reservados.
          {footer.attribution && (
            <>
              {' '}
              Powered by{' '}
              <a
                href="https://lucasterwebstudio.com/es"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/85 underline-offset-4 transition-colors hover:text-pub-action hover:underline"
              >
                Lucaster Web Studio
              </a>
              .
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
