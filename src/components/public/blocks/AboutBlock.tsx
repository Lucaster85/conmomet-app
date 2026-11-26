import { BLOCK_ANCHORS } from '../../../config/landing';
import Reveal from '../Reveal';
import Section from '../Section';
import RichText from './RichText';
import type { BlockProps } from './types';

// Grilla de plano que se desvanece hacia la izquierda: la misma textura del hero, sin animación, de fondo de la frase.
const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(var(--pub-line) 1px, transparent 1px), linear-gradient(90deg, var(--pub-line) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
  maskImage: 'radial-gradient(ellipse at 100% 50%, #000 0%, transparent 70%)',
  WebkitMaskImage: 'radial-gradient(ellipse at 100% 50%, #000 0%, transparent 70%)',
} as const;

// Columnas según cuántos párrafos tenga la marca (literales completos para que Tailwind las detecte).
const COLUMNS: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

export default function AboutBlock({ block }: BlockProps<'about'>) {
  const { eyebrow, title, paragraphs, banner } = block.content;

  return (
    <Section id={BLOCK_ANCHORS.about} eyebrow={eyebrow} title={title} className="bg-white/50">
      {paragraphs.length > 0 && (
        <div className={`grid gap-8 md:gap-10 ${COLUMNS[Math.min(paragraphs.length, 3)]}`}>
          {paragraphs.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.07} className="border-l-2 border-pub-brand py-1 pl-6">
              <p className="leading-relaxed text-pub-muted">{paragraph}</p>
            </Reveal>
          ))}
        </div>
      )}

      {banner && (
        // Frase destacada: la versión grande del filete azul de los párrafos, sobre la grilla del plano. Lo que va
        // entre **asteriscos** se resalta en el azul de la marca.
        <Reveal className="relative isolate mt-12 overflow-hidden rounded-3xl border border-pub-line bg-white px-6 py-10 md:mt-16 md:px-14 md:py-16">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-70" style={GRID_STYLE} />
          <div className="flex gap-5 md:gap-8">
            <span aria-hidden="true" className="w-1 shrink-0 rounded-full bg-pub-brand md:w-1.5" />
            <p className="font-display max-w-3xl text-2xl leading-tight font-bold tracking-tight text-pub-navy md:text-4xl">
              <RichText highlightClassName="text-pub-brand">{banner}</RichText>
            </p>
          </div>
        </Reveal>
      )}
    </Section>
  );
}
