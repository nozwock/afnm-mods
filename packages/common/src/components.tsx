import {
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps,
  Typography,
  TypographyProps,
} from '@mui/material';

export interface NumericFieldProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  labelProps?: TypographyProps;
  fieldProps?: TextFieldProps;
}

export const NumericMultiplierField: React.FC<NumericFieldProps> = (props) => (
  <NumericField
    {...props}
    fieldProps={{
      ...props?.fieldProps,
      slotProps: {
        ...props?.fieldProps?.slotProps,
        input: {
          startAdornment: <InputAdornment position="start">X</InputAdornment>,
          ...props?.fieldProps?.slotProps?.input,
        },
      },
    }}
  ></NumericField>
);

export const NumericField: React.FC<NumericFieldProps> = ({
  label,
  value,
  onChange,
  labelProps,
  fieldProps,
}) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between">
    {label ? <Typography {...labelProps}>{label}</Typography> : null}
    <TextField
      size="small"
      {...fieldProps}
      slotProps={{
        ...fieldProps?.slotProps,
        htmlInput: {
          min: 0,
          step: 0.1,
          ...fieldProps?.slotProps?.htmlInput,
        },
      }}
      type="number"
      value={value}
      onChange={
        onChange
          ? (e) => {
              const value = e.target.value ? parseFloat(e.target.value) : 0;
              onChange(value);
            }
          : undefined
      }
    ></TextField>
  </Stack>
);
