export type ButtonVariant = 'action' | 'ghost' | 'dark';

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-brand';

const VARIANTS: Record<ButtonVariant, string> = {
  // Ámbar: el color de acción, solo para botones.
  action:
    'bg-pub-action text-pub-navy hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(245,158,11,0.7)]',
  ghost: 'border border-pub-navy/20 text-pub-navy hover:border-pub-navy/50 hover:bg-pub-navy/5',
  dark: 'bg-pub-navy text-white hover:bg-pub-navy-2',
};

/**
 * Clases de un botón de la web pública. Es un helper y no un componente para poder aplicarlo
 * tanto a un `<button>` como a un `<a>` o un `<Link>`. Base con 48 px de target táctil.
 */
export function buttonClasses(variant: ButtonVariant = 'action', extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}
