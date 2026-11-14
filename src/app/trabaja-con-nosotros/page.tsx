'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Collapse, Container, FormControlLabel, FormHelperText, Link, Paper,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import {
  AttachFileOutlined as AttachIcon, CheckCircleOutlined as CheckIcon, CloseOutlined as CloseIcon,
  SendOutlined as SendIcon,
} from '@mui/icons-material';
import LandingHeader from '../../components/landing/LandingHeader';
import FooterSection from '../../components/landing/FooterSection';
import GearSpinner from '../../components/GearSpinner';
import DniField from '../../components/DniField';
import PhoneField from '../../components/PhoneField';
import EmailField from '../../components/EmailField';
import DateField from '../../components/DateField';
import { ConsentTextService, JobApplicationValues, PublicJobApplicationService } from '../../utils/api';
import { validateDni, validateEmail, validatePhone } from '../../utils/validators';
import { validateCandidateFile, CANDIDATE_ACCEPT } from '../../utils/candidates';

// "Trabajá con nosotros" (ver FLOWS.md §60): página pública, sin sesión. Lo que se envía queda como una
// postulación en Personal → Postulantes y avisa al equipo.

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

// El texto de privacidad NO está escrito acá: lo edita Personal desde Configuración General y viene del backend
// (FLOWS.md §63), junto con su número de versión. Se muestra como texto plano (`pre-line`, nunca HTML) y la versión
// se manda al enviar, para que quede guardado qué texto vio la persona al aceptar.
function PrivacyText({ content }: { content: string }) {
  return (
    <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{content}</Typography>
    </Box>
  );
}

export default function JobApplicationPage() {
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

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>, apply: (file: File | null) => void) => {
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
  const formErrors = {
    name: !values.name.trim(),
    lastname: !values.lastname.trim(),
    dni: !!validateDni(values.dni, { required: true }),
    contact: needsContact,
    email: !!validateEmail(values.email),
    phone: !!validatePhone(values.phone),
    cv: !cv,
    consent: !consent,
  };
  const hasErrors = Object.values(formErrors).some(Boolean);
  const show = submitAttempted;

  const handleSubmit = async (e: React.FormEvent) => {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Typography variant="body2" noWrap sx={{ flex: 1 }}>{file.name}</Typography>
        <Button size="small" startIcon={<CloseIcon />} onClick={onClear}>Quitar</Button>
      </Box>
    );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <LandingHeader />
      {/* Espacio de la barra fija */}
      <Box sx={{ height: { xs: 64, md: 92 } }} />

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, flex: 1 }}>
        {done ? (
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: 'center' }}>
            <CheckIcon color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>¡Gracias por postularte!</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>{done}</Typography>
            <Button variant="contained" href="/" sx={{ mt: 3 }}>Volver al inicio</Button>
          </Paper>
        ) : (
          <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
            <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em">Trabajá con nosotros</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Dejanos tus datos y tu CV. Cuando surja una búsqueda que se ajuste a tu perfil, nos comunicamos con vos.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

                <Typography variant="subtitle1" fontWeight={600}>Tus datos</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField label="Nombre" required fullWidth value={values.name} onChange={(e) => set({ name: e.target.value })}
                    autoComplete="given-name" error={show && formErrors.name} helperText={show && formErrors.name ? 'Ingresá tu nombre.' : undefined} />
                  <TextField label="Apellido" required fullWidth value={values.lastname} onChange={(e) => set({ lastname: e.target.value })}
                    autoComplete="family-name" error={show && formErrors.lastname} helperText={show && formErrors.lastname ? 'Ingresá tu apellido.' : undefined} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <DniField label="DNI" required fullWidth value={values.dni} onChange={(dni) => set({ dni })} forceShowError={show} />
                  <DateField label="Fecha de nacimiento" fullWidth value={values.birth_date} onChange={(birth_date) => set({ birth_date })} InputLabelProps={{ shrink: true }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <PhoneField label="Teléfono / WhatsApp" fullWidth value={values.phone} onChange={(phone) => set({ phone })} forceShowError={show} />
                  <EmailField label="Email" fullWidth value={values.email} onChange={(email) => set({ email })} forceShowError={show} />
                </Box>
                <FormHelperText error={show && needsContact} sx={{ mt: '-12px !important' }}>
                  Dejanos al menos un teléfono o un email para poder comunicarnos con vos.
                </FormHelperText>
                <TextField label="Localidad" fullWidth value={values.locality} onChange={(e) => set({ locality: e.target.value })} autoComplete="address-level2" />

                <Typography variant="subtitle1" fontWeight={600} sx={{ pt: 1 }}>Tu perfil</Typography>
                <TextField label="Oficio o puesto de interés" fullWidth value={values.trade} onChange={(e) => set({ trade: e.target.value })}
                  placeholder="Ej: soldador, electricista, ayudante de montaje" />
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
                  <TextField label="Años de experiencia" type="number" fullWidth value={values.years_experience}
                    onChange={(e) => set({ years_experience: e.target.value })} inputProps={{ min: 0, max: 70 }} />
                  <FormControlLabel sx={{ flexShrink: 0 }} label="Tengo registro de conducir"
                    control={<Switch checked={values.has_driver_license} onChange={(e) => set({ has_driver_license: e.target.checked })} />} />
                </Box>
                <TextField label="Contanos sobre vos (opcional)" fullWidth multiline rows={4} value={values.cover_letter}
                  onChange={(e) => set({ cover_letter: e.target.value })} />

                <Typography variant="subtitle1" fontWeight={600} sx={{ pt: 1 }}>Tu CV</Typography>
                <Box>
                  <input ref={cvInput} type="file" hidden accept={CANDIDATE_ACCEPT} onChange={(e) => pickFile(e, setCv)} />
                  <Button variant="outlined" startIcon={<AttachIcon />} onClick={() => cvInput.current?.click()} color={show && formErrors.cv ? 'error' : 'primary'}>
                    {cv ? 'Cambiar CV' : 'Adjuntar CV *'}
                  </Button>
                  {fileRow(cv, () => setCv(null))}
                  <FormHelperText error={show && formErrors.cv}>
                    {show && formErrors.cv ? 'Adjuntá tu CV para continuar. ' : ''}PDF, Word, JPG o PNG · hasta 10 MB.
                  </FormHelperText>
                </Box>
                <Box>
                  <input ref={letterInput} type="file" hidden accept={CANDIDATE_ACCEPT} onChange={(e) => pickFile(e, setLetterFile)} />
                  <Button variant="text" startIcon={<AttachIcon />} onClick={() => letterInput.current?.click()}>
                    {letterFile ? 'Cambiar carta de presentación' : 'Adjuntar carta de presentación (opcional)'}
                  </Button>
                  {fileRow(letterFile, () => setLetterFile(null))}
                </Box>

                {/* Campo trampa: fuera de pantalla, sin foco ni autocompletado ni lectura por lectores de pantalla.
                    Una persona nunca lo ve; un bot sí lo completa (ver FLOWS.md §58). */}
                <Box aria-hidden sx={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label>
                    No completar este campo
                    <input type="text" name="website" value={values.website} onChange={(e) => set({ website: e.target.value })} tabIndex={-1} autoComplete="off" />
                  </label>
                </Box>

                {privacyError && <Alert severity="error">{privacyError} Recargá la página para poder enviar tu postulación.</Alert>}
                <Box>
                  <FormControlLabel
                    control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
                    label="Acepto que Conmomet S.A. trate mis datos personales para evaluar mi postulación."
                    sx={{ alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                  />
                  <FormHelperText error={show && formErrors.consent} sx={{ ml: 4 }}>
                    {show && formErrors.consent ? 'Tenés que aceptar para poder enviar tu postulación. ' : ''}
                    <Link component="button" type="button" underline="always" onClick={() => setShowPrivacy((v) => !v)}>
                      {showPrivacy ? 'Ocultar' : 'Ver'} cómo tratamos tus datos
                    </Link>
                  </FormHelperText>
                  <Collapse in={showPrivacy}>{privacy && <PrivacyText content={privacy.content} />}</Collapse>
                </Box>

                <Button type="submit" variant="contained" size="large" disabled={sending || !privacy}
                  endIcon={sending ? <GearSpinner size={18} /> : <SendIcon />} sx={{ borderRadius: '10px', fontWeight: 600, alignSelf: { sm: 'flex-end' }, px: 4 }}>
                  {sending ? 'Enviando...' : 'Enviar postulación'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}
      </Container>

      <FooterSection />
    </Box>
  );
}
