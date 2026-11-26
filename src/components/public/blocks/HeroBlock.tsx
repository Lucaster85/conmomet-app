import Image from 'next/image';
import { BLOCK_ANCHORS } from '../../../config/landing';
import { getEnvironmentConfig } from '../../../config/environment';
import { buttonClasses } from '../Button';
import { ArrowRightIcon } from '../icons';
import Reveal from '../Reveal';
import SiloBlueprint from '../SiloBlueprint';
import GridBlueprint from './GridBlueprint';
import RichText from './RichText';
import type { BlockProps } from './types';

// Hero de la landing: un plano que se autodibuja atrás (variante `blueprint-silo` o `blueprint-grid`)
// y, adelante, la foto de la marca si tiene — "del plano a la obra". Server component: el único
// cliente es Reveal.
export default function HeroBlock({ block, manifest }: BlockProps<'hero'>) {
  const { legalName } = getEnvironmentConfig();
  const { content, variant } = block;
  const has = (type: keyof typeof BLOCK_ANCHORS) => manifest.blocks.some((b) => b.type === type);

  return (
    <section
      id={BLOCK_ANCHORS.hero}
      className="relative isolate flex min-h-[calc(100dvh-3.5rem)] items-center overflow-hidden px-5 py-16 md:px-8"
    >
      {variant === 'blueprint-grid' ? (
        <GridBlueprint className="absolute inset-0 -z-10 h-full w-full" />
      ) : (
        // En mobile `slice` rellena y recorta a la silueta; en desktop el plano entero, a la derecha
        <SiloBlueprint
          className="absolute inset-0 -z-10 h-full w-full lg:left-[18%] lg:w-[82%]"
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-pub-bg/20 via-pub-bg/60 to-pub-bg" />

      <div
        className={`mx-auto grid w-full max-w-6xl items-center gap-12 ${content.image ? 'lg:grid-cols-[1.15fr_0.85fr]' : ''}`}
      >
        <div>
          {content.eyebrow && (
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-pub-line bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-pub-brand-deep backdrop-blur">
                <span className="size-2 rounded-full bg-pub-action" aria-hidden="true" />
                {content.eyebrow}
              </p>
            </Reveal>
          )}
          <Reveal delay={0.08}>
            <h1 className="font-display mt-6 text-5xl font-extrabold tracking-tight text-pub-navy md:text-7xl">
              {legalName}
            </h1>
          </Reveal>
          {content.subtitle && (
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg font-medium uppercase leading-snug tracking-wide text-pub-muted md:text-xl">
                <RichText>{content.subtitle}</RichText>
              </p>
            </Reveal>
          )}
          <Reveal delay={0.24} className="mt-10 flex flex-wrap gap-3">
            {content.primaryCta && has('contact') && (
              <a href={`#${BLOCK_ANCHORS.contact}`} className={buttonClasses('action')}>
                {content.primaryCta} <ArrowRightIcon width={18} height={18} />
              </a>
            )}
            {content.secondaryCta && has('works') && (
              <a href={`#${BLOCK_ANCHORS.works}`} className={buttonClasses('ghost')}>
                {content.secondaryCta}
              </a>
            )}
          </Reveal>
        </div>

        {/* Solo desktop: card de vidrio que flota, con la foto de la marca */}
        {content.image && (
          <div className="float-slow hidden lg:block">
            <div className="rounded-3xl border border-pub-line bg-white/60 p-3 shadow-[0_30px_80px_-30px_rgba(11,37,69,0.35)] backdrop-blur">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <Image
                  src={`/brand/landing/${content.image}`}
                  alt={content.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 0px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
