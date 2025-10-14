/**
 * MobileInput Components
 * Touch-friendly input components optimized for mobile devices
 */

import React, { useState, useRef } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Button,
  IconButton,
  TextFieldProps,
  SelectProps
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useHapticFeedback } from '../../hooks/useGestures';

/**
 * MobileTextField - Large tap target text input
 */
export const MobileTextField: React.FC<TextFieldProps & {
  onClear?: () => void;
}> = ({ onClear, ...props }) => {
  const { light } = useHapticFeedback();

  const handleClear = () => {
    light();
    onClear?.();
  };

  return (
    <TextField
      {...props}
      fullWidth
      InputProps={{
        ...props.InputProps,
        sx: {
          minHeight: 48,
          fontSize: '1rem',
          ...props.InputProps?.sx
        },
        endAdornment: onClear && props.value ? (
          <IconButton onClick={handleClear} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        ) : props.InputProps?.endAdornment
      }}
      sx={{
        '& .MuiInputBase-root': {
          minHeight: 48
        },
        '& .MuiInputBase-input': {
          fontSize: '1rem',
          padding: '14px 16px'
        },
        ...props.sx
      }}
    />
  );
};

/**
 * MobilePhoneInput - Phone number input with tel keyboard
 */
export const MobilePhoneInput: React.FC<Omit<TextFieldProps, 'type'>> = (props) => {
  return (
    <MobileTextField
      {...props}
      type="tel"
      inputProps={{
        inputMode: 'tel',
        pattern: '[0-9]*',
        ...props.inputProps
      }}
      placeholder="(555) 123-4567"
    />
  );
};

/**
 * MobileEmailInput - Email input with email keyboard
 */
export const MobileEmailInput: React.FC<Omit<TextFieldProps, 'type'>> = (props) => {
  return (
    <MobileTextField
      {...props}
      type="email"
      inputProps={{
        inputMode: 'email',
        autoCapitalize: 'none',
        autoCorrect: 'off',
        ...props.inputProps
      }}
      placeholder="email@example.com"
    />
  );
};

/**
 * MobileNumberInput - Number input with numeric keyboard
 */
export const MobileNumberInput: React.FC<Omit<TextFieldProps, 'type'> & {
  min?: number;
  max?: number;
  step?: number;
}> = ({ min, max, step, ...props }) => {
  return (
    <MobileTextField
      {...props}
      type="number"
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        min,
        max,
        step,
        ...props.inputProps
      }}
    />
  );
};

/**
 * MobileSelect - Touch-friendly select dropdown
 */
export const MobileSelect: React.FC<SelectProps & {
  options: Array<{ value: string | number; label: string }>;
}> = ({ options, ...props }) => {
  return (
    <FormControl fullWidth>
      {props.label && <InputLabel>{props.label}</InputLabel>}
      <Select
        {...props}
        sx={{
          minHeight: 48,
          '& .MuiSelect-select': {
            fontSize: '1rem',
            padding: '14px 16px'
          },
          ...props.sx
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: '60vh',
              '& .MuiMenuItem-root': {
                minHeight: 48,
                fontSize: '1rem',
                padding: '12px 16px'
              }
            }
          }
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/**
 * MobileDatePicker - Native date picker input
 */
export const MobileDatePicker: React.FC<Omit<TextFieldProps, 'type'> & {
  onDateChange?: (date: string) => void;
}> = ({ onDateChange, ...props }) => {
  const { light } = useHapticFeedback();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    light();
    inputRef.current?.showPicker?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange?.(e.target.value);
    props.onChange?.(e);
  };

  return (
    <MobileTextField
      {...props}
      inputRef={inputRef}
      type="date"
      onChange={handleChange}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <IconButton onClick={handleIconClick} edge="end">
            <CalendarIcon />
          </IconButton>
        )
      }}
    />
  );
};

/**
 * MobileTimePicker - Native time picker input
 */
export const MobileTimePicker: React.FC<Omit<TextFieldProps, 'type'> & {
  onTimeChange?: (time: string) => void;
}> = ({ onTimeChange, ...props }) => {
  const { light } = useHapticFeedback();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    light();
    inputRef.current?.showPicker?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange?.(e.target.value);
    props.onChange?.(e);
  };

  return (
    <MobileTextField
      {...props}
      inputRef={inputRef}
      type="time"
      onChange={handleChange}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <IconButton onClick={handleIconClick} edge="end">
            <TimeIcon />
          </IconButton>
        )
      }}
    />
  );
};

/**
 * MobileTextArea - Multi-line text input
 */
export const MobileTextArea: React.FC<TextFieldProps> = (props) => {
  return (
    <MobileTextField
      {...props}
      multiline
      rows={props.rows || 4}
      InputProps={{
        ...props.InputProps,
        sx: {
          minHeight: 'auto',
          ...props.InputProps?.sx
        }
      }}
    />
  );
};

/**
 * MobileSearchInput - Search input with clear button
 */
export const MobileSearchInput: React.FC<Omit<TextFieldProps, 'type'> & {
  onSearch?: (value: string) => void;
}> = ({ onSearch, ...props }) => {
  const [value, setValue] = useState(props.value || '');
  const { light } = useHapticFeedback();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch?.(newValue);
    props.onChange?.(e);
  };

  const handleClear = () => {
    light();
    setValue('');
    onSearch?.('');
  };

  return (
    <MobileTextField
      {...props}
      value={value}
      onChange={handleChange}
      onClear={handleClear}
      type="search"
      placeholder={props.placeholder || 'Search...'}
      inputProps={{
        autoCapitalize: 'none',
        autoCorrect: 'off',
        ...props.inputProps
      }}
    />
  );
};

/**
 * MobileButton - Touch-friendly button with haptic feedback
 */
export const MobileButton: React.FC<React.ComponentProps<typeof Button> & {
  haptic?: boolean;
}> = ({ haptic = true, onClick, ...props }) => {
  const { light } = useHapticFeedback();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic) {
      light();
    }
    onClick?.(e);
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      sx={{
        minHeight: 48,
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: 2,
        padding: '12px 24px',
        '&:active': {
          transform: 'scale(0.98)'
        },
        ...props.sx
      }}
    />
  );
};

/**
 * MobileChipButton - Chip-style button for filters/tags
 */
export const MobileChipButton: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}> = ({ label, selected = false, onClick, icon }) => {
  const { light } = useHapticFeedback();

  const handleClick = () => {
    light();
    onClick?.();
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        padding: '8px 16px',
        minHeight: 36,
        borderRadius: 18,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        backgroundColor: selected ? 'primary.main' : 'transparent',
        color: selected ? 'white' : 'text.primary',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:active': {
          transform: 'scale(0.95)'
        }
      }}
    >
      {icon}
      {label}
    </Box>
  );
};

export default {
  MobileTextField,
  MobilePhoneInput,
  MobileEmailInput,
  MobileNumberInput,
  MobileSelect,
  MobileDatePicker,
  MobileTimePicker,
  MobileTextArea,
  MobileSearchInput,
  MobileButton,
  MobileChipButton
};
