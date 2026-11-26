import type { SVGProps } from 'react';

/**
 * Fondo neutro del hero (variante `blueprint-grid`): una grilla de planos que se autodibuja, con las
 * mismas animaciones `draw-line` / `pulse-node` de globals.css. Sirve para cualquier rubro, a
 * diferencia de SiloBlueprint, que dibuja una obra concreta.
 */
const STEP = 0.06; // segundos entre un trazo y el siguiente
const NODES = [
  [200, 160],
  [400, 320],
  [600, 160],
  [300, 480],
  [500, 480],
];

interface GridBlueprintProps {
  className?: string;
  preserveAspectRatio?: SVGProps<SVGSVGElement>['preserveAspectRatio'];
}

export default function GridBlueprint({ className, preserveAspectRatio = 'xMidYMid slice' }: GridBlueprintProps) {
  const lines = [
    ...[100, 200, 300, 400, 500, 600, 700].map((x) => `M${x} 0 V640`),
    ...[80, 160, 240, 320, 400, 480, 560].map((y) => `M0 ${y} H800`),
  ];

  return (
    <svg
      viewBox="0 0 800 640"
      className={className}
      preserveAspectRatio={preserveAspectRatio}
      fill="none"
      stroke="var(--pub-line)"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {lines.map((d, i) => (
        <path key={d} d={d} pathLength={1} className="draw-line" style={{ animationDelay: `${(i * STEP).toFixed(2)}s` }} />
      ))}
      {NODES.map(([cx, cy]) => (
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
    </svg>
  );
}
