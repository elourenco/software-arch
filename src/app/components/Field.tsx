import type React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type FieldProps = Omit<React.ComponentProps<"input">, "onChange"> & {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/** Controlled input with consistent label, spacing, and validation feedback. */
export function Field({ label, name, type = "text", value, onChange, error, id, ...props }: FieldProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;

  return (
    <div className="field">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        type={type}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
