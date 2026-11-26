'use client';

import { useEffect, useState } from 'react';
import type { WorksContent } from '../../../config/landing';
import GearSpinner from '../../GearSpinner';
import Reveal from '../Reveal';
import Section from '../Section';

const API_BASE_URL =
  (typeof window !== 'undefined' && (window as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000';

interface SliderMedia {
  id: number;
  title?: string;
  description?: string;
  url: string;
  // URL firmada que manda la API (el bucket es privado): se muestra `view_url ?? url`.
  view_url?: string | null;
  order?: number;
}

interface Work {
  id: number;
  title: string;
  description: string;
  image: string;
}

// Mismo origen de datos que antes (`/public/media/type/slider`, ordenado por `order`), pero en vez
// de un slider con JS: grilla en desktop y carril con scroll-snap en mobile (CSS puro).
// Es el único bloque cliente: los textos y el ancla le llegan por props desde WorksBlock (server).
// No importa BLOCK_ANCHORS de config/landing porque ese módulo usa `fs` y no puede ir al bundle cliente.
export default function WorksGallery({ id, eyebrow, title, empty }: WorksContent & { id: string }) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/media/type/slider`)
      .then((res) => res.json())
      .then((data) => {
        const items: SliderMedia[] = Array.isArray(data) ? data : data.data || [];
        const sorted = [...items].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
        setWorks(
          sorted.map((item) => ({
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            image: item.view_url ?? item.url,
          })),
        );
      })
      .catch(() => setWorks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section id={id} eyebrow={eyebrow} title={title} className="bg-white/50">
      {loading ? (
        <div className="flex justify-center py-10">
          <GearSpinner />
        </div>
      ) : works.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-pub-line bg-white/60 px-6 py-12 text-center text-pub-muted">
          {empty}
        </p>
      ) : (
        <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {works.map((work, i) => (
            <Reveal
              as="li"
              key={work.id}
              delay={(i % 3) * 0.07}
              className="w-[80%] shrink-0 snap-center overflow-hidden rounded-2xl border border-pub-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-pub-brand hover:shadow-[0_24px_50px_-24px_rgba(11,37,69,0.35)] sm:w-[55%] md:w-auto"
            >
              {/* La URL viene firmada de la API (bucket privado): next/image no aplica */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={work.image}
                alt={work.title || 'Trabajo realizado'}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              {(work.title || work.description) && (
                <div className="p-5">
                  {work.title && (
                    <h3 className="font-display text-lg font-bold tracking-tight text-pub-navy">{work.title}</h3>
                  )}
                  {work.description && (
                    <p className="mt-2 leading-relaxed text-pub-muted">{work.description}</p>
                  )}
                </div>
              )}
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
