import { BLOCK_ANCHORS } from '../../../config/landing';
import Reveal from '../Reveal';
import Section from '../Section';
import type { BlockProps } from './types';

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
        <Reveal className="mt-12 rounded-2xl bg-pub-brand px-6 py-8 text-center md:mt-16 md:px-12 md:py-10">
          <p className="font-display text-xl font-bold tracking-tight text-white md:text-3xl">{banner}</p>
        </Reveal>
      )}
    </Section>
  );
}
