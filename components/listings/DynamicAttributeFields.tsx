// components/listings/DynamicAttributeFields.tsx
// Renders category-specific form fields dynamically

'use client';

import { Input } from '@/components/ui/input';
import { api } from '@/lib/trpc';
import type { CategoryId } from '@/lib/constants';

// Local type matching the shape returned by api.category.getAttributes
interface AttributeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'year' | 'select' | 'multiselect' | 'boolean';
  required?: boolean;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}

interface DynamicAttributeFieldsProps {
  categoryId: CategoryId;
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export function DynamicAttributeFields({
  categoryId,
  values,
  onChange,
  errors = {},
}: DynamicAttributeFieldsProps) {
  const { data: rawFields, isLoading } = api.category.getAttributes.useQuery(
    { categoryId }
  );
  const fields = (rawFields ?? []) as AttributeField[];

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-1/3 bg-secondary rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <div key={i} className="h-11 bg-secondary rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">
        Dodatne informacije
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => onChange(field.name, value)}
            error={errors[field.name]}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldRendererProps {
  field: AttributeField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const baseInputClass =
    "h-11 rounded-xl border border-black/15 bg-white/80 px-3 text-sm w-full";
  const errorClass = error ? "border-red-500" : "";

  const renderLabel = () => (
    <label className="text-sm font-medium flex items-center gap-1">
      {field.label}
      {field.required && <span className="text-red-500">*</span>}
      {field.suffix && (
        <span className="text-black/40 font-normal">({field.suffix})</span>
      )}
    </label>
  );

  const renderError = () =>
    error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null;

  switch (field.type) {
    case 'text':
      return (
        <div className="grid gap-2">
          {renderLabel()}
          <Input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={field.placeholder}
            className={`${baseInputClass} ${errorClass}`}
          />
          {renderError()}
        </div>
      );

    case 'number':
      return (
        <div className="grid gap-2">
          {renderLabel()}
          <div className="relative">
            <Input
              type="number"
              value={value !== undefined ? String(value) : ''}
              onChange={(e) => {
                const num = e.target.value ? Number(e.target.value) : undefined;
                onChange(num);
              }}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
              className={`${baseInputClass} ${errorClass} ${field.suffix ? 'pr-12' : ''}`}
            />
            {field.suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 text-sm">
                {field.suffix}
              </span>
            )}
          </div>
          {renderError()}
        </div>
      );

    case 'year':
      const currentYear = new Date().getFullYear();
      return (
        <div className="grid gap-2">
          {renderLabel()}
          <Input
            type="number"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => {
              const num = e.target.value ? Number(e.target.value) : undefined;
              onChange(num);
            }}
            min={field.min ?? 1900}
            max={field.max ?? currentYear + 1}
            placeholder={String(currentYear)}
            className={`${baseInputClass} ${errorClass}`}
          />
          {renderError()}
        </div>
      );

    case 'select':
      return (
        <div className="grid gap-2">
          {renderLabel()}
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            className={`${baseInputClass} ${errorClass}`}
          >
            <option value="">-- Izaberite --</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {renderError()}
        </div>
      );

    case 'multiselect':
      // For now, render as a simple select
      // Could be enhanced with a proper multiselect component
      return (
        <div className="grid gap-2">
          {renderLabel()}
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              onChange(selected.length > 0 ? selected : undefined);
            }}
            className={`${baseInputClass} ${errorClass} min-h-[100px]`}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-black/50">Držite Ctrl za više opcija</p>
          {renderError()}
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-3 h-11">
          <input
            type="checkbox"
            id={field.name}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked || undefined)}
            className="w-5 h-5 rounded border-black/15 accent-black"
          />
          <label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
            {field.label}
          </label>
          {renderError()}
        </div>
      );

    default:
      return null;
  }
}

// Export the field renderer for potential reuse
export { FieldRenderer };
