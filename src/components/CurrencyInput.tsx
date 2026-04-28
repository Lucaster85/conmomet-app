import React, { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { TextField, TextFieldProps, InputAdornment, OutlinedInputProps } from '@mui/material';

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const NumericFormatCustom = forwardRef<HTMLInputElement, CustomProps & Omit<NumericFormatProps, 'onChange'>>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value, // Envía el string sin formato numérico ('20000.50')
            },
          });
        }}
        thousandSeparator="."
        decimalSeparator=","
        allowNegative={false}
        decimalScale={2}
        fixedDecimalScale
        valueIsNumericString
      />
    );
  }
);

export type CurrencyInputProps = Omit<TextFieldProps, 'onChange'> & {
  value: number | string | null | undefined;
  onChange: (value: number | null) => void;
  name?: string;
};

export default function CurrencyInput({ value, onChange, name = 'currency-input', ...props }: CurrencyInputProps) {
  return (
    <TextField
      {...props}
      value={value === 0 && props.placeholder ? '' : value}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
      name={name}
      InputProps={{
        ...props.InputProps,
        inputComponent: NumericFormatCustom as unknown as OutlinedInputProps['inputComponent'],
        startAdornment: props.InputProps?.startAdornment || (
          <InputAdornment position="start">$</InputAdornment>
        ),
      }}
    />
  );
}
