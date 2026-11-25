import type { ComponentType, SVGProps } from 'react';
import {
  BlueprintIcon,
  ContainerIcon,
  CraneIcon,
  LatheIcon,
  PaintRollerIcon,
  RoofIcon,
  SheetBendIcon,
  WeldIcon,
  WrenchIcon,
} from './icons';
import Reveal from './Reveal';
import Section from './Section';

interface Service {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  text?: string;
  bullets?: string[];
}

const SERVICES: Service[] = [
  {
    title: 'Alquiler de Grúas',
    icon: CraneIcon,
    bullets: [
      'Plataforma unipersonal hasta 10 m de altura.',
      'Grúas de 8 tn, 20 tn y 30 tn hasta 42 m de altura.',
    ],
  },
  {
    title: 'Torneria Industrial',
    icon: LatheIcon,
    text: 'Tornería de precisión para piezas y componentes personalizados.',
  },
  {
    title: 'Corte y plegado de chapas de alta precisión',
    icon: SheetBendIcon,
    bullets: ['Corte con guillotina hasta 8 mm por 3200 mm.', 'Plegadora 125 tn por 3200 mm.'],
  },
  {
    title: 'Mantenimiento de maquinarias industriales y reparación de equipos',
    icon: WrenchIcon,
    text: 'Mano de obra calificada para trabajos mecánicos.',
  },
  {
    title: 'Instalación y reparación de techos y cubiertas',
    icon: RoofIcon,
    text: 'Mano de obra calificada para trabajos de instalación y reparación de techos y cubiertas.',
  },
  {
    title: 'Soldadura',
    icon: WeldIcon,
    text: 'Soldadura de precisión, piezas únicas y series cortas para la industria.',
  },
  {
    title: 'Pintura y revestimiento de paredes y estructuras',
    icon: PaintRollerIcon,
    text: 'Pintura y revestimiento de paredes y estructuras para la industria.',
  },
  {
    title: 'Traslado y posicionamiento de containers y cargas pesadas',
    icon: ContainerIcon,
    text: 'Traslado y posicionamiento de containers y cargas pesadas para la industria.',
  },
  {
    title: 'Proyecto y dirección de obra, cálculos estructurales.',
    icon: BlueprintIcon,
    text: 'Proyectos y trabajos civiles y steel frame. Construcción de todo tipo de estructuras metálicas, galvanizadas en caliente y soldaduras de alta presión.',
  },
];

export default function Servicios() {
  return (
    <Section id="servicios" eyebrow="Qué hacemos" title="Nuestros Servicios" className="bg-pub-bg">
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ title, icon: Icon, text, bullets }, i) => (
          <Reveal
            as="li"
            key={title}
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
              {title}
            </h3>
            {text && <p className="mt-3 leading-relaxed text-pub-muted">{text}</p>}
            {bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-pub-muted marker:text-pub-brand">
                {bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
