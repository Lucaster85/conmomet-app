import { getEnvironmentConfig } from '../../config/environment';
import Reveal from './Reveal';
import Section from './Section';

const CLIENTS = [
  { name: 'Bunge', shortName: 'BUN' },
  { name: 'Renova', shortName: 'RNV' },
];

// Fila estática y centrada: sin flechas ni dots, así no puede haber controles muertos cuando los
// clientes son pocos (el slider anterior, con 2 clientes y una ventana de 4, quedaba roto).
export default function Clientes() {
  const { appName } = getEnvironmentConfig();

  return (
    <Section id="clientes" eyebrow="Clientes" title="Confían en nosotros" className="bg-pub-bg">
      <p className="max-w-xl text-pub-muted">
        Empresas líderes del sector confían en {appName} para sus proyectos.
      </p>
      <ul className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
        {CLIENTS.map((client, i) => (
          <Reveal
            as="li"
            key={client.name}
            delay={i * 0.07}
            className="flex min-h-32 w-40 flex-col items-center justify-center gap-3 rounded-2xl border border-pub-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-pub-brand hover:shadow-[0_24px_50px_-24px_rgba(11,37,69,0.35)] md:w-52"
          >
            {/* Placeholder de logo: círculo con la sigla, hasta tener los logos reales */}
            <span className="font-display flex size-14 items-center justify-center rounded-full bg-pub-brand text-xs font-bold tracking-widest text-white">
              {client.shortName}
            </span>
            <span className="font-semibold text-pub-navy">{client.name}</span>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
