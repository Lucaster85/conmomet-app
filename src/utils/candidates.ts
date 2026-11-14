import type {
  InterviewModality, InterviewRecommendation, InterviewStatus, CandidateFileKind, CandidateRejectionReason, CandidateSource, CandidateStage, CandidateApplication, Candidate,
} from './api';

// Vocabulario de Postulantes (ver FLOWS.md §59). Espejo de api_conmomet/helpers/candidateStages.js y de
// los ENUM de las tablas — si se suma una etapa, un origen o un motivo, va en los tres lados.

type ChipColor = 'default' | 'info' | 'warning' | 'success' | 'error';

export const CANDIDATE_STAGE_LABELS: Record<CandidateStage, { label: string; color: ChipColor }> = {
  new: { label: 'Nueva', color: 'warning' },
  screening: { label: 'En revisión', color: 'info' },
  interview: { label: 'Entrevista', color: 'info' },
  offer: { label: 'Oferta', color: 'success' },
  hired: { label: 'Contratada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
  withdrawn: { label: 'Retirada', color: 'default' },
};

export const OPEN_STAGES: CandidateStage[] = ['new', 'screening', 'interview', 'offer'];
export const isOpenStage = (stage: CandidateStage) => OPEN_STAGES.includes(stage);

// Espejo de TRANSITIONS del backend, SIN 'hired': esa etapa se alcanza dando de alta al postulante como
// empleado, no desde un botón. Sirve para ofrecer solo las acciones que el servidor va a aceptar.
export const CANDIDATE_TRANSITIONS: Record<CandidateStage, CandidateStage[]> = {
  new: ['screening', 'interview', 'rejected', 'withdrawn'],
  screening: ['interview', 'offer', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['rejected', 'withdrawn'],
  rejected: ['screening'],
  withdrawn: ['screening'],
  hired: [],
};

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSource, string> = {
  web: 'Web',
  in_person: 'Presencial',
  referral: 'Recomendado',
  other: 'Otro',
};

// Orígenes que se pueden elegir al cargar a mano: "Web" es del formulario público.
export const INTERNAL_SOURCE_OPTIONS = (['in_person', 'referral', 'other'] as const).map((value) => ({
  value,
  label: CANDIDATE_SOURCE_LABELS[value],
}));

export const CANDIDATE_FILE_KIND_LABELS: Record<CandidateFileKind, string> = {
  cv: 'CV',
  cover_letter: 'Carta de presentación',
  certificate: 'Certificado',
  other: 'Otro',
};

export const CANDIDATE_FILE_KIND_OPTIONS = (Object.keys(CANDIDATE_FILE_KIND_LABELS) as CandidateFileKind[]).map((value) => ({
  value,
  label: CANDIDATE_FILE_KIND_LABELS[value],
}));

export const CANDIDATE_REJECTION_LABELS: Record<CandidateRejectionReason, string> = {
  profile_mismatch: 'El perfil no se ajusta',
  no_vacancies: 'No hay vacantes',
  no_response: 'No respondió',
  failed_interview: 'No pasó la entrevista',
  salary_expectations: 'Pretensión salarial',
  other: 'Otro motivo',
};

export const CANDIDATE_REJECTION_OPTIONS = (Object.keys(CANDIDATE_REJECTION_LABELS) as CandidateRejectionReason[]).map((value) => ({
  value,
  label: CANDIDATE_REJECTION_LABELS[value],
}));

// Mismos límites que middlewares/candidateUpload.js. El backend los vuelve a validar; acá se chequean
// para avisar antes de subir.
export const CANDIDATE_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const CANDIDATE_MAX_FILES = 5;
export const CANDIDATE_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

// Devuelve un mensaje si el archivo no sirve, o null si está bien.
export function validateCandidateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return `"${file.name}": solo se aceptan archivos PDF, Word (doc/docx), JPG o PNG.`;
  }
  if (file.size > CANDIDATE_MAX_FILE_BYTES) return `"${file.name}": cada archivo puede pesar hasta 10 MB.`;
  return null;
}

// La postulación que importa de un vistazo: la abierta si hay (solo puede haber una), si no la más
// reciente. `applications` ya viene ordenado de la más nueva a la más vieja.
export function currentApplication(candidate: Pick<Candidate, 'applications'>): CandidateApplication | null {
  const list = candidate.applications || [];
  return list.find((a) => isOpenStage(a.stage)) || list[0] || null;
}

export const fullName = (c: { name: string; lastname: string }) => `${c.name} ${c.lastname}`;

// Entrevistas (FLOWS.md §61). Espejo de api_conmomet/helpers/candidateInterviews.js.
export const INTERVIEW_MODALITY_LABELS: Record<InterviewModality, string> = {
  in_person: 'Presencial',
  phone: 'Telefónica',
  video: 'Videollamada',
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, { label: string; color: ChipColor }> = {
  scheduled: { label: 'Agendada', color: 'info' },
  completed: { label: 'Realizada', color: 'success' },
  cancelled: { label: 'Cancelada', color: 'default' },
  no_show: { label: 'No vino', color: 'warning' },
};

export const INTERVIEW_RECOMMENDATION_LABELS: Record<InterviewRecommendation, { label: string; color: ChipColor }> = {
  advance: { label: 'Avanzar', color: 'success' },
  hold: { label: 'Esperar', color: 'warning' },
  reject: { label: 'No avanzar', color: 'error' },
};

// "mié 3/12, 15:30" en hora de Argentina (la que se agendó).
export function formatInterviewWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
