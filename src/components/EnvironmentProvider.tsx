'use client';
import React, { createContext, useContext } from 'react';
import type { EnvironmentConfig } from '../config/environment';

// Por qué un contexto y no window.__ENV__: el distintivo se dibuja en componentes que también se
// renderizan en el servidor. Si el cliente lo leyera de window.__ENV__, el HTML del servidor (sin
// distintivo) y el de la hidratación (con distintivo) no coincidirían. Con el contexto, las dos
// pasadas reciben el mismo valor, que viene del layout raíz.
const EMPTY_ENVIRONMENT: EnvironmentConfig = { label: '', color: '', textColor: '' };

const EnvironmentContext = createContext<EnvironmentConfig>(EMPTY_ENVIRONMENT);

export function EnvironmentProvider({
  value,
  children,
}: {
  value: EnvironmentConfig;
  children: React.ReactNode;
}) {
  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useAppEnvironment(): EnvironmentConfig {
  return useContext(EnvironmentContext);
}
