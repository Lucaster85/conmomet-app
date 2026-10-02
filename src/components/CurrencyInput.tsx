import React, { forwardRef, useState } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { TextField, TextFieldProps, InputAdornment, OutlinedInputProps } from '@mui/material';

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const NumericFormatCustom = forwardRef<HTMLInputElement, CustomProps & Omit<NumericFormatProps, 'onChange'>>(
  function NumericFormatCustom(props, ref) {
    const { onChange, allowNegative = false, fixedDecimalScale = true, ...other } = props;

    return (
      <NumericFormat
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        valueIsNumericString
        {...other}
        allowNegative={allowNegative}
        fixedDecimalScale={fixedDecimalScale}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value, // Envía el string sin formato numérico ('20000.50')
            },
          });
        }}
      />
    );
  }
);

export type CurrencyInputProps = Omit<TextFieldProps, 'onChange' | 'value'> & {
  value: number | string | null | undefined;
  onChange: (value: number | null) => void;
  name?: string;
  currency?: 'ARS' | 'USD';
  adornment?: React.ReactNode | null;
  allowNegative?: boolean;
  showZero?: boolean;
};

const CURRENCY_SYMBOL: Record<'ARS' | 'USD', string> = { ARS: '$', USD: 'US$' };

export default function CurrencyInput({
  value,
  onChange,
  name = 'currency-input',
  currency = 'ARS',
  adornment,
  allowNegative = false,
  showZero = false,
  ...props
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  const isEmpty = value === null || value === undefined || value === ''
    || (!showZero && Number(value) === 0);

  const resolvedAdornment = adornment === null
    ? undefined
    : adornment ?? props.InputProps?.startAdornment ?? (
      <InputAdornment position="start">{CURRENCY_SYMBOL[currency]}</InputAdornment>
    );

  return (
    <TextField
      {...props}
      value={isEmpty ? '' : value}
      placeholder={props.placeholder ?? '0,00'}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      name={name}
      InputProps={{
        ...props.InputProps,
        inputComponent: NumericFormatCustom as unknown as OutlinedInputProps['inputComponent'],
        startAdornment: resolvedAdornment,
        inputProps: {
          ...props.InputProps?.inputProps,
          allowNegative,
          fixedDecimalScale: !focused,
        },
      }}
    />
  );
}
