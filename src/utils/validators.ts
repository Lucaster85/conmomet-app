// Validadores por campo compartidos por los inputs de src/components/{Email,Cuit,Dni,Phone}Field
// y por el handleSubmit de cada formulario que los usa — la idea es que haya una sola fuente de
// verdad: el componente la usa para el error inline, el formulario la vuelve a correr antes de
// guardar para bloquear el submit. Todas devuelven `null` si está bien, o el mensaje a mostrar.
// Campo vacío + no `required` -> `null` (no molesta en campos opcionales).

import { digitsOnly, isValidCuit } from './cuit';

interface ValidateOptions {
  required?: boolean;
}

export function validateEmail(value: string, { required }: ValidateOptions = {}): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? 'El email es obligatorio' : null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'El email no tiene un formato válido';
  return null;
}

export function validateCuit(value: string, { required }: ValidateOptions = {}): string | null {
  const digits = digitsOnly(value);
  if (!digits) return required ? 'El CUIT/CUIL es obligatorio' : null;
  if (digits.length !== 11) return 'Debe tener 11 dígitos';
  if (!isValidCuit(digits)) return 'El dígito verificador no coincide';
  return null;
}

export function validateDni(value: string, { required }: ValidateOptions = {}): string | null {
  const digits = digitsOnly(value);
  if (!digits) return required ? 'El DNI es obligatorio' : null;
  if (digits.length < 7 || digits.length > 8) return 'El DNI debe tener 7 u 8 dígitos';
  return null;
}

export function validatePhone(value: string, { required }: ValidateOptions = {}): string | null {
  const digits = digitsOnly(value);
  if (!digits) return required ? 'El teléfono es obligatorio' : null;
  if (digits.length < 8 || digits.length > 15) return 'Debe tener entre 8 y 15 dígitos';
  return null;
}

// "12345678" -> "12.345.678"
export function maskDni(value: string): string {
  const d = digitsOnly(value).slice(0, 8);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
