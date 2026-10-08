import React from 'react';

// Los importes de un presupuesto son netos: el IVA se suma al facturar. Este sufijo evita repetir
// el texto "+ IVA" en cada lugar donde se muestra un total (listado, formulario, Ver/Imprimir y
// pestaña Presupuesto del proyecto). Sin children, renderiza solo el sufijo.
export default function TotalWithTax({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <span style={{ fontSize: '0.75em', fontWeight: 500, opacity: 0.7, whiteSpace: 'nowrap' }}> + IVA</span>
    </>
  );
}
