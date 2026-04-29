'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TextField, TextFieldProps, InputAdornment, CircularProgress } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

type AddressAutocompleteProps = Omit<TextFieldProps, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

function loadGooglePlacesAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const check = () => {
        if (window.google?.maps?.places) resolve();
        else setTimeout(check, 100);
      };
      check();
      return;
    }

    const callbackName = 'initGooglePlaces_' + Math.random().toString(36).substring(2, 9);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[callbackName] = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[callbackName];
      reject(new Error('Error al cargar Google Places API'));
    };
    document.head.appendChild(script);
  });
}

export default function AddressAutocomplete({ value, onChange, ...textFieldProps }: AddressAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);
  // Keep onChange stable inside the listener without recreating autocomplete
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place?.formatted_address) onChangeRef.current(place.formatted_address);
    });
  }, []); // stable — uses refs internally

  useEffect(() => {
    if (!API_KEY) {
      console.warn('AddressAutocomplete: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY no está definida.');
      return;
    }

    let cancelled = false;

    loadGooglePlacesAPI()
      .then(() => {
        if (cancelled) return;
        initializeAutocomplete();
        setIsLoaded(true);
      })
      .catch((err) => console.error('Google Places:', err));

    return () => {
      cancelled = true;
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [initializeAutocomplete]);

  const showSpinner = !isLoaded && !!API_KEY;

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        ...textFieldProps.slotProps,
        input: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(textFieldProps.slotProps?.input as any),
          startAdornment: (
            <InputAdornment position="start">
              <LocationOnIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          endAdornment: showSpinner ? (
            <InputAdornment position="end">
              <CircularProgress size={16} />
            </InputAdornment>
          ) : undefined,
        },
        htmlInput: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(textFieldProps.slotProps?.htmlInput as any),
          // MUI v7: ref on htmlInput slot points to the <input> element
          ref: inputRef,
          autoComplete: 'new-password',
          autoCapitalize: 'off',
          autoCorrect: 'off',
          spellCheck: false,
          'data-lpignore': 'true',
          'data-form-type': 'other',
          'data-1p-ignore': 'true',
        },
      }}
    />
  );
}
