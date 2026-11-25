'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';

interface RevealProps {
  children?: ReactNode;
  /** Segundos de espera, para el stagger manual (`delay={i * 0.07}`). */
  delay?: number;
  /** Elemento a renderizar: así el propio `<li>` o `<section>` puede ser el que aparece. */
  as?: ElementType;
  className?: string;
}

/**
 * Aparición al scrollear: IntersectionObserver con `once` que prende la clase `is-visible`.
 * La transición vive en CSS (`.reveal` en globals.css), que además apaga todo con
 * `prefers-reduced-motion` y deja el contenido en su estado final.
 */
export default function Reveal({ children, delay = 0, as = 'div', className = '' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-60px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      className: `reveal ${visible ? 'is-visible' : ''} ${className}`.trim(),
      style: { '--reveal-delay': `${delay}s` } as CSSProperties,
    },
    children,
  );
}
