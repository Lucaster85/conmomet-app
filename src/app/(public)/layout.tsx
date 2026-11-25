// Route group de la web pública (landing y /trabaja-con-nosotros): no cambia ninguna URL.
// Las clases van en un wrapper y no en el <body> porque le ganan a los selectores de `body` del
// CssBaseline de MUI y al `font-family: Arial` de globals.css, que si no pisarían la tipografía.
// El header y el footer públicos se suman acá en la etapa 2.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-body min-h-dvh bg-pub-bg text-pub-navy">{children}</div>;
}
