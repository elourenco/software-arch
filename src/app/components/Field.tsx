import { Input } from "./ui/input";
import { Label } from "./ui/label";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
};

/** Controlled input with consistent label and spacing. */
export function Field({ label, name, type = "text", value, onChange }: FieldProps) {
  return (
    <div className="field">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
