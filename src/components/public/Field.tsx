'use client';

import { useId, useState } from 'react';
import type {
  FocusEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

// Campos de formulario de la web pública, en Tailwind. Mismo contrato de errores que los wrappers
// de MUI que reemplazan (DniField, PhoneField, EmailField): el error llega como texto, y se muestra
// cuando el formulario intentó enviar (`showError`) o, si `validateOnBlur`, apenas se sale del campo.

interface ShellProps {
  label: string;
  required?: boolean;
  /** Mensaje de error del validador (null/undefined = válido). */
  error?: string | null;
  /** El formulario lo prende al intentar enviar, para revelar todos los errores de una. */
  showError?: boolean;
  /** Muestra el error también al salir del campo, sin esperar al envío. */
  validateOnBlur?: boolean;
  hint?: ReactNode;
  className?: string;
}

const CONTROL =
  'w-full rounded-xl border border-pub-line bg-white px-4 text-base text-pub-navy placeholder:text-pub-muted/60 transition-colors focus:border-pub-brand-deep focus:ring-2 focus:ring-pub-brand/20 focus:outline-none aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20';

function useFieldState({ error, showError, validateOnBlur }: Pick<ShellProps, 'error' | 'showError' | 'validateOnBlur'>) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const visibleError = error && (showError || (validateOnBlur && touched)) ? error : null;
  return {
    id,
    visibleError,
    markTouched: () => setTouched(true),
    controlProps: {
      id,
      'aria-invalid': visibleError ? true : undefined,
      'aria-describedby': visibleError ? `${id}-error` : undefined,
    } as const,
  };
}

function Shell({
  id,
  label,
  required,
  visibleError,
  hint,
  className = '',
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  visibleError: string | null;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-pub-navy">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {visibleError ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {visibleError}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-pub-muted">{hint}</p>
      )}
    </div>
  );
}

type InputProps = ShellProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'>;

export function Field({
  label,
  required,
  error,
  showError,
  validateOnBlur,
  hint,
  className,
  onBlur,
  ...rest
}: InputProps) {
  const { id, visibleError, markTouched, controlProps } = useFieldState({ error, showError, validateOnBlur });
  return (
    <Shell id={id} label={label} required={required} visibleError={visibleError} hint={hint} className={className}>
      <input
        {...rest}
        {...controlProps}
        onBlur={(e: FocusEvent<HTMLInputElement>) => {
          markTouched();
          onBlur?.(e);
        }}
        className={`${CONTROL} min-h-12`}
      />
    </Shell>
  );
}

type TextAreaProps = ShellProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'id'>;

export function TextAreaField({
  label,
  required,
  error,
  showError,
  validateOnBlur,
  hint,
  className,
  onBlur,
  ...rest
}: TextAreaProps) {
  const { id, visibleError, markTouched, controlProps } = useFieldState({ error, showError, validateOnBlur });
  return (
    <Shell id={id} label={label} required={required} visibleError={visibleError} hint={hint} className={className}>
      <textarea
        {...rest}
        {...controlProps}
        onBlur={(e: FocusEvent<HTMLTextAreaElement>) => {
          markTouched();
          onBlur?.(e);
        }}
        className={`${CONTROL} min-h-28 py-3`}
      />
    </Shell>
  );
}

type SelectProps = ShellProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'>;

export function SelectField({
  label,
  required,
  error,
  showError,
  validateOnBlur,
  hint,
  className,
  onBlur,
  children,
  ...rest
}: SelectProps) {
  const { id, visibleError, markTouched, controlProps } = useFieldState({ error, showError, validateOnBlur });
  return (
    <Shell id={id} label={label} required={required} visibleError={visibleError} hint={hint} className={className}>
      <select
        {...rest}
        {...controlProps}
        onBlur={(e: FocusEvent<HTMLSelectElement>) => {
          markTouched();
          onBlur?.(e);
        }}
        className={`${CONTROL} min-h-12`}
      >
        {children}
      </select>
    </Shell>
  );
}
