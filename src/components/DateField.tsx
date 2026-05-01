import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { TextFieldProps } from '@mui/material/TextField';

interface DateFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value: string | undefined | null; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export default function DateField({ value, onChange, label, fullWidth, size, ...rest }: DateFieldProps) {
  return (
    <DatePicker
      label={label}
      format="DD/MM/YYYY"
      value={value ? dayjs(value) : null}
      onChange={(newDate) => {
        onChange(newDate ? newDate.format('YYYY-MM-DD') : '');
      }}
      slotProps={{
        // @ts-expect-error Types for pickers text field are strictly incompatible with standard text field props
        textField: {
          fullWidth,
          size,
          ...rest
        }
      }}
    />
  );
}
