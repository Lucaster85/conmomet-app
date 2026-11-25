import type { SVGProps } from 'react';

/**
 * Plano de un silo en vista de elevación: el fondo del hero ("del plano a la obra").
 * SVG inline, server-rendered y sin JS: cada trazo se autodibuja con la animación `draw` de
 * globals.css (hace falta `pathLength={1}`) y los puntos de unión laten con `pulse-node`.
 * Los trazos son finitos y de color `--pub-line` para que lea como textura, no como ilustración.
 *
 * En mobile se recorta a la silueta: la escalera, las cotas y los textos van dentro de un
 * `<g className="hidden sm:block">` porque a 375 px son ilegibles.
 */

const STEP = 0.07; // segundos entre un trazo y el siguiente

interface SiloBlueprintProps {
  className?: string;
  /** `slice` rellena el contenedor recortando los bordes; `meet` muestra el plano entero. */
  preserveAspectRatio?: SVGProps<SVGSVGElement>['preserveAspectRatio'];
}

export default function SiloBlueprint({
  className,
  preserveAspectRatio = 'xMidYMid meet',
}: SiloBlueprintProps) {
  // Contador de trazos: cada uno arranca un poquito después del anterior.
  let n = 0;
  const stroke = (d: string, extraDelay = 0) => (
    <path
      key={`${n}-${d}`}
      d={d}
      pathLength={1}
      className="draw-line"
      style={{ animationDelay: `${(n++ * STEP + extraDelay).toFixed(2)}s` }}
    />
  );

  const rungs: string[] = [];
  for (let y = 240; y <= 580; y += 20) rungs.push(`M548 ${y} H570`);

  return (
    <svg
      viewBox="0 0 800 640"
      className={className}
      preserveAspectRatio={preserveAspectRatio}
      fill="none"
      stroke="var(--pub-line)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Línea de tierra */}
      {stroke('M200 600 H620')}

      {/* Techo cónico, remate y cuerpo cilíndrico */}
      {stroke('M280 190 L400 110 L520 190 Z')}
      {stroke('M392 110 V92 H408 V110')}
      {stroke('M290 190 V400')}
      {stroke('M510 190 V400')}

      {/* Anillos de chapa */}
      {[230, 270, 310, 350].map((y) => stroke(`M290 ${y} H510`))}

      {/* Cono de descarga y boca de salida */}
      {stroke('M290 400 L370 480 H430 L510 400 Z')}
      {stroke('M370 480 V510 H430 V480')}

      {/* Patas y arriostramientos */}
      {stroke('M310 400 L290 600')}
      {stroke('M490 400 L510 600')}
      {stroke('M360 470 V600')}
      {stroke('M440 470 V600')}
      {stroke('M300 520 L360 580')}
      {stroke('M360 520 L300 580')}
      {stroke('M440 520 L500 580')}
      {stroke('M500 520 L440 580')}

      {/* Detalle que solo se lee en pantallas grandes: escalera, cotas y textos */}
      <g className="hidden sm:block">
        {/* Escalera con guardahombre */}
        {stroke('M548 600 V200')}
        {stroke('M570 600 V200')}
        {rungs.map((d) => stroke(d))}
        {stroke('M510 250 H548')}
        {stroke('M510 350 H548')}
        {stroke('M510 450 H548', 0.1)}
        {[260, 340, 420, 500].map((y) => stroke(`M548 ${y} Q590 ${y + 30} 570 ${y + 60}`))}

        {/* Cota vertical (altura total) */}
        {stroke('M230 92 V600')}
        {stroke('M220 92 H240')}
        {stroke('M220 600 H240')}
        {stroke('M224 104 L230 92 L236 104')}
        {stroke('M224 588 L230 600 L236 588')}
        {stroke('M240 190 H280', 0.1)}
        {stroke('M240 400 H290', 0.1)}

        {/* Cota horizontal (diámetro) */}
        {stroke('M290 625 H510')}
        {stroke('M290 615 V635')}
        {stroke('M510 615 V635')}
        {stroke('M302 619 L290 625 L302 631')}
        {stroke('M498 619 L510 625 L498 631')}
      </g>

      {/* Puntos de unión */}
      {[
        [400, 110],
        [280, 190],
        [520, 190],
        [290, 400],
        [510, 400],
        [370, 480],
        [430, 480],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={4}
          fill="var(--pub-brand)"
          stroke="none"
          className="pulse-node"
          style={{ animationDelay: `${((cx + cy) % 7) * 0.4}s` }}
        />
      ))}

      <g
        className="hidden sm:block"
        fill="var(--pub-muted)"
        stroke="none"
        fontFamily="ui-monospace, monospace"
        fontSize={11}
        opacity={0.55}
      >
        <text x={200} y={350} transform="rotate(-90 200 350)" textAnchor="middle">
          H = 18,40 m
        </text>
        <text x={400} y={648} textAnchor="middle">
          Ø 6,00 m
        </text>
        <text x={600} y={150}>
          ELEVACIÓN · ESC 1:100
        </text>
      </g>
    </svg>
  );
}
