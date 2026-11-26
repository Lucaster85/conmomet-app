import { BLOCK_ANCHORS } from '../../../config/landing';
import Reveal from '../Reveal';
import Section from '../Section';
import type { BlockProps } from './types';

// Fila estática y centrada: sin flechas ni dots, así no puede haber controles muertos cuando los
// clientes son pocos (el slider anterior, con 2 clientes y una ventana de 4, quedaba roto).
export default function ClientsBlock({ block }: BlockProps<'clients'>) {
  const { eyebrow, title, subtitle, items } = block.content;

  return (
    <Section id={BLOCK_ANCHORS.clients} eyebrow={eyebrow} title={title} className="bg-pub-bg">
      {subtitle && <p className="max-w-xl text-pub-muted">{subtitle}</p>}
      <ul className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
        {items.map((client, i) => (
          <Reveal
            as="li"
            key={client.name}
            delay={i * 0.07}
            className="flex min-h-32 w-40 flex-col items-center justify-center gap-3 rounded-2xl border border-pub-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-pub-brand hover:shadow-[0_24px_50px_-24px_rgba(11,37,69,0.35)] md:w-52"
          >
            {client.logo ? (
              // Logo de la carpeta de marca: no pasa por next/image porque es una imagen chica y fija
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/brand/landing/${client.logo}`} alt={client.name} className="h-14 w-auto max-w-full object-contain" />
            ) : (
              // Sin logo: círculo con la sigla
              <span className="font-display flex size-14 items-center justify-center rounded-full bg-pub-brand text-xs font-bold tracking-widest text-white">
                {client.shortName}
              </span>
            )}
            <span className="font-semibold text-pub-navy">{client.name}</span>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
