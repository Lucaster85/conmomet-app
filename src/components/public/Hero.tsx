import Image from 'next/image';
import { getEnvironmentConfig } from '../../config/environment';
import { buttonClasses } from './Button';
import { ArrowRightIcon } from './icons';
import Reveal from './Reveal';
import SiloBlueprint from './SiloBlueprint';

// Hero de la landing: el plano de un silo que se autodibuja atrás y, adelante, la foto del silo
// real — "del plano a la obra". Server component: el único cliente es Reveal.
export default function Hero() {
  const { legalName } = getEnvironmentConfig();

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[calc(100dvh-3.5rem)] items-center overflow-hidden px-5 py-16 md:px-8"
    >
      {/* En mobile `slice` rellena y recorta a la silueta; en desktop el plano entero, a la derecha */}
      <SiloBlueprint
        className="absolute inset-0 -z-10 h-full w-full lg:left-[18%] lg:w-[82%]"
        preserveAspectRatio="xMidYMid slice"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-pub-bg/20 via-pub-bg/60 to-pub-bg" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-pub-line bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-pub-brand-deep backdrop-blur">
              <span className="size-2 rounded-full bg-pub-action" aria-hidden="true" />
              Quequén · Buenos Aires
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display mt-6 text-5xl font-extrabold tracking-tight text-pub-navy md:text-7xl">
              {legalName}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg font-medium uppercase leading-snug tracking-wide text-pub-muted md:text-xl">
              Soluciones integrales en montajes <strong className="text-pub-navy">metalúrgicos</strong>.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-10 flex flex-wrap gap-3">
            <a href="#contacto" className={buttonClasses('action')}>
              Contactanos <ArrowRightIcon width={18} height={18} />
            </a>
            <a href="#nuestro-trabajo" className={buttonClasses('ghost')}>
              Ver obras
            </a>
          </Reveal>
        </div>

        {/* Solo desktop: card de vidrio que flota, con la foto real */}
        <div className="float-slow hidden lg:block">
          <div className="rounded-3xl border border-pub-line bg-white/60 p-3 shadow-[0_30px_80px_-30px_rgba(11,37,69,0.35)] backdrop-blur">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image
                src="/img/dashboardSlider/grain-steel-silo.jpg"
                alt="Silo metálico de acero montado por Conmomet"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 0px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
