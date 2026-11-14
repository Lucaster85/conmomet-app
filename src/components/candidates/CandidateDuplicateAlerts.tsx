'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Link, Stack, Typography } from '@mui/material';
import { CandidateDuplicates, CandidateEmployeeMatch, CandidateService } from '../../utils/api';
import { fullName } from '../../utils/candidates';

interface Props {
  dni: string;
  cuil: string;
  email: string;
  phone: string;
  // Al editar, el propio postulante no cuenta como duplicado de sí mismo.
  excludeId?: number;
}

const MATCH_LABELS: Record<string, string> = { dni: 'mismo DNI', cuil: 'mismo CUIL', email: 'mismo email', phone: 'mismo teléfono' };

const formatDate = (iso?: string | null) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-AR') : '');

// Solo se consulta con datos que pueden identificar a alguien: un DNI a medio tipear no sirve.
const worthChecking = (p: Props) =>
  p.dni.replace(/\D/g, '').length >= 7 ||
  p.cuil.replace(/\D/g, '').length === 11 ||
  /\S+@\S+\.\S+/.test(p.email) ||
  p.phone.replace(/\D/g, '').length >= 8;

// Aviso EN VIVO mientras se carga o edita un postulante (ver FLOWS.md §59): otros postulantes que
// podrían ser la misma persona y si el DNI/CUIL ya es de un empleado actual o de un ex-empleado.
// Solo avisa, nunca bloquea el guardado: el servidor es quien rechaza un DNI/CUIL repetido.
export default function CandidateDuplicateAlerts(props: Props) {
  const { dni, cuil, email, phone, excludeId } = props;
  const [result, setResult] = useState<CandidateDuplicates | null>(null);
  // Descarta la respuesta de una consulta vieja si ya se disparó otra: sin esto, tipear rápido
  // puede mostrar el resultado de un DNI que ya no está en el campo.
  const requestId = useRef(0);

  useEffect(() => {
    if (!worthChecking(props)) {
      setResult(null);
      return;
    }
    const current = ++requestId.current;
    const timeout = setTimeout(() => {
      CandidateService.checkDuplicates({ dni, cuil, email, phone, exclude_id: excludeId })
        .then((data) => { if (current === requestId.current) setResult(data); })
        // Un aviso que no se pudo calcular no justifica molestar: el servidor igual valida al guardar.
        .catch(() => { if (current === requestId.current) setResult(null); });
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni, cuil, email, phone, excludeId]);

  if (!result) return null;
  const { candidates, current_employees: current, former_employees: former } = result;
  if (candidates.length === 0 && current.length === 0 && former.length === 0) return null;

  const employeeName = (e: CandidateEmployeeMatch) => fullName(e);

  return (
    <Stack spacing={1}>
      {current.map((e) => (
        <Alert key={`c${e.id}`} severity="warning">
          Este DNI o CUIL ya pertenece a <strong>{employeeName(e)}</strong>, que es empleado actual.
        </Alert>
      ))}
      {former.map((e) => (
        <Alert key={`f${e.id}`} severity="warning">
          <strong>Ex-empleado:</strong> este DNI o CUIL pertenece a {employeeName(e)}
          {e.termination_date ? `, que egresó el ${formatDate(e.termination_date)}` : ''}. Se puede cargar como postulante, pero
          no se lo va a poder dar de alta como empleado desde acá (el reingreso se trata aparte).
        </Alert>
      ))}
      {candidates.length > 0 && (
        <Alert severity="info">
          <Typography variant="body2" fontWeight={600}>Posible duplicado: ya hay postulantes cargados con estos datos</Typography>
          {candidates.map((c) => (
            <Typography key={c.id} variant="body2">
              <Link href={`/dashboard/candidates/${c.id}`} target="_blank" rel="noopener noreferrer">{fullName(c)}</Link>
              {' — '}{c.matched_on.map((m) => MATCH_LABELS[m]).join(', ')}
            </Typography>
          ))}
        </Alert>
      )}
    </Stack>
  );
}
