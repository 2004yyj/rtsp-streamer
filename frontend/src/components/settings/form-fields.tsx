import { cn } from "../../lib/utils";

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  mono?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  mono,
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, mono && "font-mono")}
      />
    </Field>
  );
}

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  hint?: string;
  min?: number;
  max?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  min,
  max,
}: NumberFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className={cn(inputClass, "font-mono")}
      />
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}

export function ToggleField({
  label,
  checked,
  onChange,
  description,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface ProtocolSectionProps {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  address: string;
  onAddressChange: (v: string) => void;
  defaultPort: string;
  children?: React.ReactNode;
}

export function ProtocolSection({
  title,
  enabled,
  onToggle,
  address,
  onAddressChange,
  defaultPort,
  children,
}: ProtocolSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <ToggleField label={title} checked={enabled} onChange={onToggle} />
      {enabled && (
        <div className="space-y-3 pl-1">
          <TextField
            label="Address"
            value={address}
            onChange={onAddressChange}
            placeholder={defaultPort}
            mono
            hint={`기본값: ${defaultPort}`}
          />
          {children}
        </div>
      )}
    </div>
  );
}
