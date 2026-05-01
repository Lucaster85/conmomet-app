'use client';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';
import dayjs from 'dayjs';

dayjs.locale('es');

export default function MuiXProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      {children}
    </LocalizationProvider>
  );
}
