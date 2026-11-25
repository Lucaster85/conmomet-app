'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppEnvironment } from '../EnvironmentProvider';
import { buttonClasses } from './Button';
import { UserCircleIcon } from './icons';

export const JOBS_PATH = '/trabaja-con-nosotros';

const NAV_ITEMS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nuestro trabajo', href: '#nuestro-trabajo' },
  { label: 'Clientes', href: '#clientes' },
  { label: 'Contacto', href: '#contacto' },
];

// Header de la web pública, compartido por la landing y "Trabajá con nosotros" (FLOWS.md §60).
// Los links de sección son anchors nativos: en la landing hacen scroll (suave, por CSS), y desde
// otra página llevan a `/#seccion`, porque ahí esos ids no existen.
export default function PublicHeader() {
  const { appName, legalName } = useAppEnvironment();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onLanding = pathname === '/';
  const hrefFor = (anchor: string) => (onLanding ? anchor : `/${anchor}`);

  // Con el menú abierto el body no scrollea, y Escape lo cierra.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-pub-line/60 bg-pub-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href={onLanding ? '#inicio' : '/'}
          onClick={close}
          className="flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-landing.svg" alt={appName} className="h-9 w-auto" />
          <span className="font-display text-lg font-bold tracking-tight text-pub-navy">
            {legalName}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.filter((item) => item.href !== '#contacto').map((item) => (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              className="rounded-full px-3 py-2 text-sm font-medium text-pub-muted transition-colors hover:text-pub-navy"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={JOBS_PATH}
            className="rounded-full px-3 py-2 text-sm font-medium text-pub-muted transition-colors hover:text-pub-navy"
          >
            Trabajá con nosotros
          </Link>
          <Link href={hrefFor('#contacto')} className={buttonClasses('action', 'ml-2 !min-h-10')}>
            Contactanos
          </Link>
          <Link
            href="/login"
            aria-label="Iniciar sesión"
            className="ml-1 flex size-10 items-center justify-center rounded-full text-pub-brand-deep transition-colors hover:bg-pub-navy/5"
          >
            <UserCircleIcon width={26} height={26} />
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="relative flex size-12 items-center justify-center lg:hidden"
        >
          <span
            className={`absolute h-0.5 w-6 rounded bg-pub-navy transition-all duration-300 ${
              open ? 'rotate-45' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 rounded bg-pub-navy transition-opacity duration-300 ${
              open ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 rounded bg-pub-navy transition-all duration-300 ${
              open ? '-rotate-45' : 'translate-y-2'
            }`}
          />
        </button>
      </div>

      {/* Menú mobile: overlay a pantalla completa debajo del header */}
      <div
        id="menu-mobile"
        hidden={!open}
        className="fixed inset-x-0 top-14 bottom-0 overflow-y-auto bg-pub-bg px-5 py-8 lg:hidden"
      >
        <nav aria-label="Menú móvil" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              onClick={close}
              className="font-display border-b border-pub-line/60 py-4 text-2xl font-bold tracking-tight text-pub-navy"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={JOBS_PATH}
            onClick={close}
            className="font-display border-b border-pub-line/60 py-4 text-2xl font-bold tracking-tight text-pub-brand-deep"
          >
            Trabajá con nosotros
          </Link>
        </nav>
        <Link href="/login" onClick={close} className={buttonClasses('ghost', 'mt-8 w-full')}>
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}
