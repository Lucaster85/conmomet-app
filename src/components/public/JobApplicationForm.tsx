'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import GearSpinner from '../GearSpinner';
import { useAppEnvironment } from '../EnvironmentProvider';
import { ConsentTextService, JobApplicationValues, PublicJobApplicationService } from '../../utils/api';
import { validateCandidateFile, CANDIDATE_ACCEPT } from '../../utils/candidates';
import { digitsOnly } from '../../utils/cuit';
import { maskDni, validateDni, validateEmail, validatePhone } from '../../utils/validators';
import { buttonClasses } from './Button';
import { Field, TextAreaField } from './Field';
import { CheckIcon } from './icons';

const initialValues: JobApplicationValues = {
  name: '',
  lastname: '',
  dni: '',
  email: '',
  phone: '',
  birth_date: '',
  locality: '',
  trade: '',
  years_experience: '',
  has_driver_license: false,
  cover_letter: '',
  website: '',
};

const SUBTITLE = 'text-xs font-semibold uppercase tracking-[0.2em] text-pub-brand-deep';

// El texto de privacidad NO está escrito acá: lo edita Personal desde Configuración General y viene del backend
// (FLOWS.md §63), junto con su número de versión. Se muestra como texto plano (`whitespace-pre-line`, nunca HTML)
// y la versión se manda al enviar, para que quede guardado qué texto vio la persona al aceptar.
function PrivacyText({ content }: { content: string }) {
  return (
    <div className="mt-3 max-h-64 overflow-y-auto rounded-xl bg-pub-bg p-4 text-sm leading-relaxed whitespace-pre-line text-pub-muted">
      {content}
    </div>
  );
}

export default function JobApplicationForm() {
  const { legalName } = useAppEnvironment();
  const [values, setValues] = useState<JobApplicationValues>(initialValues);
  const [cv, setCv] = useState<File | null>(null);
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [privacy, setPrivacy] = useState<{ version: number; content: string } | null>(null);
  const [privacyError, setPrivacyError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const cvInput = useRef<HTMLInputElement>(null);
  const letterInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ConsentTextService.getPublicCurrent()
      .then(setPrivacy)
      .catch((err) => setPrivacyError(err instanceof Error ? err.message : 'No se pudo cargar el texto de privacidad.'));
  }, []);

  const set = (patch: Partial<JobApplicationValues>) => setValues((prev) => ({ ...prev, ...patch }));

  const pickFile = (e: ChangeEvent<HTMLInputElement>, apply: (file: File | null) => void) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;
    const problem = validateCandidateFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    apply(file);
  };

  const needsContact = !values.email.trim() && !values.phone.trim();
  const dniError = validateDni(values.dni, { required: true });
  const emailError = validateEmail(values.email);
  const phoneError = validatePhone(values.phone);
  const formErrors = {
    name: !values.name.trim(),
    lastname: !values.lastname.trim(),
    dni: !!dniError,
    contact: needsContact,
    email: !!emailError,
    phone: !!phoneError,
    cv: !cv,
    consent: !consent,
  };
  const hasErrors = Object.values(formErrors).some(Boolean);
  const show = submitAttempted;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors || !cv || !privacy) {
      setError('Revisá los campos marcados antes de enviar.');
      return;
    }
    setError('');
    setSending(true);
    try {
      setDone(await PublicJobApplicationService.submit(values, cv, letterFile, privacy.version));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu postulación. Probá de nuevo en unos minutos.');
    } finally {
      setSending(false);
    }
  };

  const fileRow = (file: File | null, onClear: () => void) =>
    file && (
      <div className="mt-2 flex items-center gap-3 text-sm">
        <span className="min-w-0 flex-1 truncate text-pub-navy">{file.name}</span>
        <button type="button" onClick={onClear} className="font-semibold text-pub-brand-deep hover:underline">
          Quitar
        </button>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-16">
      {done ? (
        <div role="status" className="rounded-3xl border border-pub-line bg-white p-8 text-center md:p-12">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-pub-action text-pub-navy">
            <CheckIcon width={32} height={32} strokeWidth={2.4} />
          </span>
          <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-pub-navy">¡Gracias por postularte!</h1>
          <p className="mt-3 text-pub-muted">{done}</p>
          <Link href="/" className={buttonClasses('dark', 'mt-8')}>
            Volver al inicio
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-pub-line bg-white p-6 md:p-10">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-pub-brand-deep">
            <span aria-hidden="true" className="h-px w-6 bg-pub-brand" />
            Postulaciones
          </p>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-pub-navy md:text-5xl">
            Trabajá con nosotros
          </h1>
          <p className="mt-4 mb-8 leading-relaxed text-pub-muted">
            Dejanos tus datos y tu CV. Cuando surja una búsqueda que se ajuste a tu perfil, nos comunicamos con vos.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <h2 className={SUBTITLE}>Tus datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre"
                required
                value={values.name}
                onChange={(e) => set({ name: e.target.value })}
                autoComplete="given-name"
                error={formErrors.name ? 'Ingresá tu nombre.' : null}
                showError={show}
              />
              <Field
                label="Apellido"
                required
                value={values.lastname}
                onChange={(e) => set({ lastname: e.target.value })}
                autoComplete="family-name"
                error={formErrors.lastname ? 'Ingresá tu apellido.' : null}
                showError={show}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="DNI"
                required
                value={maskDni(values.dni)}
                onChange={(e) => set({ dni: digitsOnly(e.target.value).slice(0, 8) })}
                inputMode="numeric"
                maxLength={10}
                error={dniError}
                showError={show}
                validateOnBlur
              />
              <Field
                label="Fecha de nacimiento"
                type="date"
                value={values.birth_date}
                onChange={(e) => set({ birth_date: e.target.value })}
                autoComplete="bday"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Teléfono / WhatsApp"
                value={values.phone}
                onChange={(e) => set({ phone: digitsOnly(e.target.value).slice(0, 15) })}
                inputMode="tel"
                maxLength={15}
                autoComplete="tel"
                error={phoneError}
                showError={show}
                validateOnBlur
              />
              <Field
                label="Email"
                type="email"
                value={values.email}
                onChange={(e) => set({ email: e.target.value })}
                autoComplete="email"
                error={emailError}
                showError={show}
                validateOnBlur
              />
            </div>
            <p className={`-mt-2 text-xs ${show && needsContact ? 'text-red-600' : 'text-pub-muted'}`}>
              Dejanos al menos un teléfono o un email para poder comunicarnos con vos.
            </p>
            <Field
              label="Localidad"
              value={values.locality}
              onChange={(e) => set({ locality: e.target.value })}
              autoComplete="address-level2"
            />

            <h2 className={`${SUBTITLE} pt-3`}>Tu perfil</h2>
            <Field
              label="Oficio o puesto de interés"
              value={values.trade}
              onChange={(e) => set({ trade: e.target.value })}
              placeholder="Ej: soldador, electricista, ayudante de montaje"
            />
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <Field
                label="Años de experiencia"
                type="number"
                min={0}
                max={70}
                value={values.years_experience}
                onChange={(e) => set({ years_experience: e.target.value })}
              />
              <label className="flex min-h-12 items-center gap-3 text-sm font-semibold text-pub-navy">
                <input
                  type="checkbox"
                  checked={values.has_driver_license}
                  onChange={(e) => set({ has_driver_license: e.target.checked })}
                  className="size-5 accent-pub-brand"
                />
                Tengo registro de conducir
              </label>
            </div>
            <TextAreaField
              label="Contanos sobre vos (opcional)"
              rows={4}
              value={values.cover_letter}
              onChange={(e) => set({ cover_letter: e.target.value })}
            />

            <h2 className={`${SUBTITLE} pt-3`}>Tu CV</h2>
            <div>
              <input ref={cvInput} type="file" hidden accept={CANDIDATE_ACCEPT} onChange={(e) => pickFile(e, setCv)} />
              <button
                type="button"
                onClick={() => cvInput.current?.click()}
                className={buttonClasses('ghost', show && formErrors.cv ? '!border-red-500 !text-red-600' : '')}
              >
                {cv ? 'Cambiar CV' : 'Adjuntar CV *'}
              </button>
              {fileRow(cv, () => setCv(null))}
              <p className={`mt-1.5 text-xs ${show && formErrors.cv ? 'text-red-600' : 'text-pub-muted'}`}>
                {show && formErrors.cv ? 'Adjuntá tu CV para continuar. ' : ''}PDF, Word, JPG o PNG · hasta 10 MB.
              </p>
            </div>
            <div>
              <input
                ref={letterInput}
                type="file"
                hidden
                accept={CANDIDATE_ACCEPT}
                onChange={(e) => pickFile(e, setLetterFile)}
              />
              <button
                type="button"
                onClick={() => letterInput.current?.click()}
                className="min-h-12 text-sm font-semibold text-pub-brand-deep hover:underline"
              >
                {letterFile ? 'Cambiar carta de presentación' : 'Adjuntar carta de presentación (opcional)'}
              </button>
              {fileRow(letterFile, () => setLetterFile(null))}
            </div>

            {/* Campo trampa: fuera de pantalla, sin foco ni autocompletado ni lectura por lectores de pantalla.
                Una persona nunca lo ve; un bot sí lo completa (ver FLOWS.md §58). */}
            <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
              <label>
                No completar este campo
                <input
                  type="text"
                  name="website"
                  value={values.website}
                  onChange={(e) => set({ website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>

            {privacyError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {privacyError} Recargá la página para poder enviar tu postulación.
              </p>
            )}
            <div>
              <label className="flex items-start gap-3 text-sm text-pub-navy">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-pub-brand"
                />
                Acepto que {legalName} trate mis datos personales para evaluar mi postulación.
              </label>
              <p className={`mt-1.5 pl-8 text-xs ${show && formErrors.consent ? 'text-red-600' : 'text-pub-muted'}`}>
                {show && formErrors.consent ? 'Tenés que aceptar para poder enviar tu postulación. ' : ''}
                <button
                  type="button"
                  onClick={() => setShowPrivacy((v) => !v)}
                  aria-expanded={showPrivacy}
                  className="font-semibold text-pub-brand-deep underline"
                >
                  {showPrivacy ? 'Ocultar' : 'Ver'} cómo tratamos tus datos
                </button>
              </p>
              {showPrivacy && privacy && <PrivacyText content={privacy.content} />}
            </div>

            <button
              type="submit"
              disabled={sending || !privacy}
              className={buttonClasses(
                'action',
                'w-full sm:w-auto sm:px-10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none',
              )}
            >
              {sending ? (
                <>
                  Enviando... <GearSpinner size={18} />
                </>
              ) : (
                'Enviar postulación'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
