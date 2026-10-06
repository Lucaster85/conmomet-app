// El código de un adicional (A-2026-001) es fijo: no cambia aunque se asigne, cambie o quite el
// proyecto padre. La relación con el padre se MUESTRA aparte: "A-2026-001 ↳ P-2026-063".
export interface ProjectCodeRef {
  code?: string | null;
  parent?: { id: number; code: string; name?: string } | null;
}

export const formatProjectCode = (project: ProjectCodeRef): string => {
  const code = project.code || '—';
  return project.parent ? `${code} ↳ ${project.parent.code}` : code;
};

// Para los selectores de proyecto (carga de horas, OCAs, asignaciones): un adicional se distingue
// de un proyecto común — "A-2026-001 · Nombre (adicional de P-2026-063)", o "(adicional)" si no
// tiene padre. Un proyecto común conserva el formato que ya tenía cada selector (`plain`).
export const formatProjectOptionLabel = (
  project: ProjectCodeRef & { name: string; is_additional?: boolean },
  plain?: string,
): string => {
  if (!project.is_additional && !project.parent) return plain ?? `${project.code || '—'} - ${project.name}`;
  const base = `${project.code || '—'} · ${project.name}`;
  return project.parent ? `${base} (adicional de ${project.parent.code})` : `${base} (adicional)`;
};
