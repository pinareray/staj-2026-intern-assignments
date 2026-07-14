import React from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: string;
  labelAction?: React.ReactNode;
};

export default function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  labelAction,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="block text-xs text-on-surface-variant font-hanken"
        >
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full rounded-xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 border border-outline-variant/20 py-3 outline-none focus:ring-1 focus:ring-primary-container/50 focus:border-primary-container/40 transition-all font-hanken ${
            icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
