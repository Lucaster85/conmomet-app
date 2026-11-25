import type { SVGProps } from 'react';

// Íconos inline (estilo trazo, 24×24) de la web pública. Se dibujan a mano en vez de traer
// @mui/icons-material a una página Tailwind solo por unos pocos íconos.
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const UserCircleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.2 18.2c1.4-2.2 3.4-3.2 5.8-3.2s4.4 1 5.8 3.2" />
  </Icon>
);

export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Icon>
);

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

export const WhatsAppIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.5L3 21Z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .6a4 4 0 0 1-1.9-1.9l.6-1-1-2L9 9.5Z" />
  </Icon>
);

export const InstagramIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </Icon>
);

export const FacebookIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8Z" />
  </Icon>
);

export const BriefcaseIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
  </Icon>
);

export const ShirtIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m8 4-5 3 2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0Z" />
  </Icon>
);

// Íconos de servicios (cada uno reemplaza a uno genérico de @mui/icons-material).
export const CraneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 21V8l-3 4M6 8h15M6 8l4-4M17 8v6M15 14h4v3h-4zM6 21h5" />
  </Icon>
);

export const LatheIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="12" r="6" />
    <circle cx="9" cy="12" r="2" />
    <path d="M15 12h6M18 9v6" />
  </Icon>
);

export const SheetBendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 18h7l4-8h7M10 18l4 3M14 10l-4-3" />
  </Icon>
);

export const WrenchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-3 3-1.5-1.5-9 7-3-3 7-9L9 9.5l3-3 2.5 0Z" />
  </Icon>
);

export const RoofIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 12 9-8 9 8M5 10.5V20h14v-9.5M9 20v-5h6v5" />
  </Icon>
);

export const WeldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 3 6 13h5l-1 8 8-11h-5l1-7Z" />
  </Icon>
);

export const PaintRollerIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="3" width="14" height="6" rx="1.5" />
    <path d="M18 6h2v5h-8v3M11 14h2v7h-2z" />
  </Icon>
);

export const ContainerIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="12" rx="1" />
    <path d="M7 6v12M11 6v12M15 6v12M19 6v12" />
  </Icon>
);

export const BlueprintIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20 18 6l2 2L6 22l-3 .5.5-3ZM14 10l2 2M3 8V3h5M16 21h5v-5" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
