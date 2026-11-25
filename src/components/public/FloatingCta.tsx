'use client';

import { useEffect, useState } from 'react';
import { buttonClasses } from './Button';

// CTA flotante de mobile: aparece pasado el hero y se esconde cuando #contacto está a la vista.
export default function FloatingCta() {
  const [pastHero, setPastHero] = useState(false);
  const [inContact, setInContact] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('inicio');
    const contact = document.getElementById('contacto');
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const o = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting));
      o.observe(hero);
      observers.push(o);
    }
    if (contact) {
      const o = new IntersectionObserver(([e]) => setInContact(e.isIntersecting));
      o.observe(contact);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const visible = pastHero && !inContact;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-5 bottom-5 z-30 transition-all duration-300 md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <a
        href="#contacto"
        tabIndex={visible ? 0 : -1}
        className={buttonClasses('action', 'w-full shadow-[0_12px_30px_-10px_rgba(11,37,69,0.5)]')}
      >
        Contactanos
      </a>
    </div>
  );
}
