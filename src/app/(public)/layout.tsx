import PublicFooter from '../../components/public/PublicFooter';
import PublicHeader from '../../components/public/PublicHeader';

// Route group de la web pública (landing y /trabaja-con-nosotros): no cambia ninguna URL.
// Las clases van en un wrapper y no en el <body> porque le ganan a los selectores de `body` del
// CssBaseline de MUI y al `font-family: Arial` de globals.css, que si no pisarían la tipografía.
// `data-public-site` habilita el scroll suave por anchor solo acá (ver globals.css).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-public-site className="font-body min-h-dvh bg-pub-bg text-pub-navy">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
