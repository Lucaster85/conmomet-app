import Link from 'next/link';
import type { ReactNode } from 'react';
import { getEnvironmentConfig } from '../../config/environment';
import {
  BriefcaseIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  ShirtIcon,
  WhatsAppIcon,
} from './icons';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=578+N%C2%B01682%2C+Quequén%2C+Buenos+Aires%2C+Argentina+7631';

const LINK_CLASS = 'flex items-center gap-2.5 text-white/65 transition-colors hover:text-white';

function ExternalLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const external = href.startsWith('http');
  return (
    <li>
      <a
        href={href}
        className={LINK_CLASS}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <span className="shrink-0 text-pub-action">{icon}</span>
        {children}
      </a>
    </li>
  );
}

// Pie de la web pública. Mismos 3 bloques y mismos datos de contacto que el de antes. El link a
// "Trabajá con nosotros" se mantiene acá porque la Ayuda (postulantes.md) dice que está en el menú
// de arriba, en el del celular y en el pie.
export default function PublicFooter() {
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
              <p className="mt-4 leading-relaxed text-white/65">
                {legalName} es una empresa líder en soluciones industriales, ofreciendo servicios de montajes,
                tornería y plegados para clientes en toda la zona costera de la provincia de Buenos Aires.
              </p>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold tracking-tight">Contacto</h3>
              <ul className="mt-4 space-y-3">
                <ExternalLink href="https://wa.me/5492262679570" icon={<WhatsAppIcon />}>
                  WhatsApp +54 9 2262 679570
                </ExternalLink>
                <ExternalLink href="tel:+542262679570" icon={<PhoneIcon />}>
                  Cotizaciones (2262) 679570
                </ExternalLink>
                <ExternalLink href="tel:+542262610787" icon={<PhoneIcon />}>
                  Administración (2262) 610787
                </ExternalLink>
                <ExternalLink href="mailto:montajes@conmomet.com.ar" icon={<MailIcon />}>
                  montajes@conmomet.com.ar
                </ExternalLink>
                <ExternalLink href={MAPS_URL} icon={<PinIcon />}>
                  578 N°1682, Quequén, Buenos Aires, Argentina
                </ExternalLink>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold tracking-tight">Enlaces rápidos</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/trabaja-con-nosotros" className={LINK_CLASS}>
                    <span className="shrink-0 text-pub-action">
                      <BriefcaseIcon />
                    </span>
                    Trabajá con nosotros
                  </Link>
                </li>
                <ExternalLink href="https://www.instagram.com/conmomet_s.a" icon={<InstagramIcon />}>
                  @conmomet_s.a
                </ExternalLink>
                <ExternalLink
                  href="https://www.facebook.com/p/conmomet_sa-100083225145876/"
                  icon={<FacebookIcon />}
                >
                  conmomet_s.a
                </ExternalLink>
                <ExternalLink href={MAPS_URL} icon={<PinIcon />}>
                  Veni a conocernos
                </ExternalLink>
                <ExternalLink href="https://www.instagram.com/indumet_" icon={<ShirtIcon />}>
                  Indumet
                </ExternalLink>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-white/15 pt-6 text-center text-sm text-white/65">
          © {new Date().getFullYear()} {legalName} Todos los derechos reservados. Powered by Lucaster Web
          Studio.
        </p>
      </div>
    </footer>
  );
}
