'use client';
import React from 'react';
import CreatableSelect from '../common/CreatableSelect';
import { ClientSupervisor } from '../../utils/api';

interface Props {
  contacts: ClientSupervisor[];
  value: number | null;
  onChange: (contact: ClientSupervisor | null) => void;
  // Dar de alta un contacto pide más que un nombre (nombre y apellido por separado, email,
  // teléfono): el padre abre su mini-diálogo de alta y, al confirmar, suma el contacto a
  // `contacts` y lo elige. Por eso no devuelve nada acá (mismo criterio que MaterialSelect).
  onCreateRequest: (name: string) => void;
  label?: string;
  helperText?: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

// Selector de contacto del cliente (ClientSupervisor) con alta rápida inline: quién aprobó un
// presupuesto o el presupuesto de una OCA. Usa el CreatableSelect genérico de la app.
export default function ClientContactSelect({
  contacts, value, onChange, onCreateRequest, label = 'Contacto del cliente', helperText, placeholder, error, size = 'small', disabled,
}: Props) {
  return (
    <CreatableSelect<ClientSupervisor>
      options={contacts}
      getLabel={(c) => `${c.lastname}, ${c.name}`}
      value={value}
      onChange={onChange}
      onCreate={async (name) => { onCreateRequest(name); return null; }}
      label={label}
      helperText={helperText}
      placeholder={placeholder}
      error={error}
      size={size}
      disabled={disabled}
      noOptionsText="Escribí para crear un contacto"
    />
  );
}
