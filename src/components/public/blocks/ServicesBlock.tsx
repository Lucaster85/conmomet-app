import { BLOCK_ANCHORS } from '../../../config/landing';
import { PUBLIC_ICONS } from '../icons';
import Reveal from '../Reveal';
import Section from '../Section';
import type { BlockProps } from './types';

export default function ServicesBlock({ block }: BlockProps<'services'>) {
  const { eyebrow, title, items } = block.content;

  return (
    <Section id={BLOCK_ANCHORS.services} eyebrow={eyebrow} title={title} className="bg-pub-bg">
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title: itemTitle, icon, text, bullets }, i) => {
          const Icon = PUBLIC_ICONS[icon];
          return (
            <Reveal
              as="li"
              key={itemTitle}
              delay={(i % 3) * 0.07}
              className="group rounded-2xl border border-pub-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-pub-brand hover:shadow-[0_24px_50px_-24px_rgba(11,37,69,0.35)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-pub-brand/10 text-pub-brand-deep transition-colors group-hover:bg-pub-brand group-hover:text-white">
                  <Icon width={24} height={24} />
                </span>
                <span className="font-display text-sm font-bold tracking-wider text-pub-brand">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-display mt-5 text-lg leading-snug font-bold tracking-tight text-pub-navy">
                {itemTitle}
              </h3>
              {text && <p className="mt-3 leading-relaxed text-pub-muted">{text}</p>}
              {bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-pub-muted marker:text-pub-brand">
                  {bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
