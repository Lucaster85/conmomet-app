'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import GearSpinner from '../GearSpinner';
import { CONTACT_REASON_OPTIONS } from '../../utils/contactInquiries';
import { buttonClasses } from './Button';
import { Field, SelectField, TextAreaField } from './Field';
import { CheckIcon } from './icons';

const API_BASE_URL =
  (typeof window !== 'undefined' && (window as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000';

interface FormData {
  motivo: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  mensaje: string;
  // Campo trampa (ver FLOWS.md §58): oculto para las personas; un bot que completa todo lo que
  // encuentra lo llena, y el servidor descarta ese envío sin avisarle.
  website: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm: FormData = {
  motivo: '',
  nombre: '',
  empresa: '',
  telefono: '',
  email: '',
  mensaje: '',
  website: '',
};

// El form tiene noValidate (para mostrar nuestros propios mensajes), así que la validación mínima
// es nuestra. El servidor repite estas mismas reglas.
function validate(form: FormData): Partial<Record<keyof FormData | 'contacto', string>> {
  const errors: Partial<Record<keyof FormData | 'contacto', string>> = {};
  if (!form.motivo) errors.motivo = 'Elegí el motivo de tu consulta.';
  if (!form.nombre.trim()) errors.nombre = 'Ingresá tu nombre.';
  if (!form.mensaje.trim()) errors.mensaje = 'Escribí tu mensaje.';
  const email = form.email.trim();
  const phone = form.telefono.trim();
  if (!email && !phone) errors.contacto = 'Dejanos un teléfono o un email para poder responderte.';
  if (email && !EMAIL_RE.test(email)) errors.email = 'El email no es válido.';
  return errors;
}

// Formulario de consulta de la sección #contacto (reemplaza al ContactModal). Mismos campos, misma
// validación y mismo POST a /public/contact; cambia solo el envase.
export default function ContactForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    // Una vez que intentó enviar, los errores se actualizan mientras corrige.
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setSubmitted(true);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        // El servidor responde un texto legible en 400 (datos inválidos) y 429 (demasiados envíos).
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No pudimos enviar tu mensaje. Probá de nuevo en unos minutos.');
      }

      setSuccess(true);
      setForm(initialForm);
      setSubmitted(false);
      setErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div role="status" className="flex flex-col items-center py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-pub-action text-pub-navy">
          <CheckIcon width={32} height={32} strokeWidth={2.4} />
        </span>
        <h3 className="font-display mt-5 text-2xl font-bold tracking-tight text-pub-navy">¡Mensaje enviado!</h3>
        <p className="mt-2 max-w-xs text-pub-muted">Te contactaremos a la brevedad.</p>
        <button type="button" onClick={() => setSuccess(false)} className={buttonClasses('ghost', 'mt-6')}>
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <SelectField
        label="Motivo de la consulta"
        name="motivo"
        value={form.motivo}
        onChange={handleChange}
        required
        error={errors.motivo}
        showError={submitted}
      >
        <option value="" disabled>
          Elegí una opción
        </option>
        {CONTACT_REASON_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>
      <Field
        label="Nombre"
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        required
        autoComplete="name"
        error={errors.nombre}
        showError={submitted}
      />
      <Field
        label="Empresa (opcional)"
        name="empresa"
        value={form.empresa}
        onChange={handleChange}
        autoComplete="organization"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Teléfono"
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          autoComplete="tel"
          inputMode="tel"
          error={errors.contacto}
          showError={submitted}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          error={errors.email ?? errors.contacto}
          showError={submitted}
        />
      </div>
      <p className={`-mt-1 text-xs ${errors.contacto ? 'text-red-600' : 'text-pub-muted'}`}>
        {errors.contacto || 'Completá al menos uno: teléfono o email.'}
      </p>
      <TextAreaField
        label="Mensaje"
        name="mensaje"
        value={form.mensaje}
        onChange={handleChange}
        required
        rows={4}
        autoComplete="off"
        error={errors.mensaje}
        showError={submitted}
      />
      {/* Campo trampa: fuera de pantalla, sin foco ni autocompletado ni lectura por lectores de
          pantalla. Una persona nunca lo ve; un bot sí lo completa (ver FLOWS.md §58). */}
      <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
        <label>
          No completar este campo
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={buttonClasses(
          'action',
          'w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none',
        )}
      >
        {loading ? (
          <>
            Enviando... <GearSpinner size={18} />
          </>
        ) : (
          'Enviar mensaje'
        )}
      </button>
    </form>
  );
}
