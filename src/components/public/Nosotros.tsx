import { getEnvironmentConfig } from '../../config/environment';
import Reveal from './Reveal';
import Section from './Section';

const PARAGRAPHS = [
  'En {{empresa}} somos un equipo apasionado y experimentado en la construcción y montaje de estructuras metálicas. Con una sólida trayectoria en el sector, nos destacamos por nuestro compromiso con la calidad, la seguridad y la eficiencia.',
  'Nuestros técnicos y operarios están altamente capacitados y cuentan con la experiencia necesaria para abordar proyectos complejos y personalizados. Contamos con una flota de maquinaria de última generación, incluyendo pantógrafo, guillotina, plegadora y grúas con capacidades de hasta 30 toneladas, lo que nos permite ofrecer soluciones integrales y flexibles a nuestros clientes.',
  'Nuestra misión es brindar soluciones de alta calidad y valor agregado a nuestros clientes, trabajando de manera segura, eficiente y comprometida con la excelencia. En {{empresa}} nos enfocamos en construir relaciones duraderas con nuestros clientes y en contribuir al éxito de sus proyectos con nuestra experiencia y dedicación.',
];

export default function Nosotros() {
  const { legalName } = getEnvironmentConfig();

  return (
    <Section id="nosotros" eyebrow="Quiénes somos" title="Nosotros" className="bg-white/50">
      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        {PARAGRAPHS.map((raw, i) => (
          <Reveal key={i} delay={i * 0.07} className="border-l-2 border-pub-brand py-1 pl-6">
            <p className="leading-relaxed text-pub-muted">{raw.replace(/{{empresa}}/g, legalName.toUpperCase())}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 rounded-2xl bg-pub-brand px-6 py-8 text-center md:mt-16 md:px-12 md:py-10">
        <p className="font-display text-xl font-bold tracking-tight text-white md:text-3xl">
          ¡Confía en nosotros para llevar tus proyectos al éxito!
        </p>
      </Reveal>
    </Section>
  );
}
