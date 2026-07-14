"use client";

import React, { useState } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: string;
  labelAction?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string | null;
};

export default function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  labelAction,
  value,
  onChange,
  disabled = false,
  error,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-xs text-stone-500 font-hanken">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-xl bg-stone-50 text-stone-900 placeholder:text-stone-400 border py-3 outline-none focus:ring-1 transition-all font-hanken disabled:opacity-60 ${
            error
              ? "border-primary-container focus:ring-primary-container/40 focus:border-primary-container"
              : "border-stone-200 focus:ring-primary-container/40 focus:border-primary-container/50"
          } ${icon ? "pl-10" : "pl-4"} ${isPassword ? "pr-11" : "pr-4"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-primary-container font-hanken">{error}</p>
      )}
    </div>
  );
}
