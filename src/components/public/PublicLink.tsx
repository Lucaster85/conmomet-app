import Link from 'next/link';
import type { LandingLink } from '../../config/landing';
import { PUBLIC_ICONS } from './icons';
import { buildHref, opensInNewTab } from './links';

interface PublicLinkProps {
  link: LandingLink;
  className: string;
  /** Si se pasa, el ícono va envuelto en un span con esta clase (pie de página). */
  iconClassName?: string;
}

/** Enlace de contacto/pie del manifiesto: arma el href desde `kind` + `value` y dibuja el ícono. */
export default function PublicLink({ link, className, iconClassName }: PublicLinkProps) {
  const Icon = PUBLIC_ICONS[link.icon];
  const href = buildHref(link.kind, link.value);
  const content = (
    <>
      {iconClassName ? (
        <span className={iconClassName}>
          <Icon />
        </span>
      ) : (
        <Icon />
      )}
      {link.label}
    </>
  );

  if (link.kind === 'internal') {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      {...(opensInNewTab(link.kind) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </a>
  );
}
