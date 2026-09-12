"use client";

import { useState } from "react";

// One labelled input, with room for a per-field error message underneath.
// Password inputs get a show/hide toggle so admins can verify what they typed.
export default function FormField({ label, error, hint, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputProps.type === "password";
  const inputType = isPassword && showPassword ? "text" : inputProps.type;

  return (
    <div>
      <label htmlFor={inputProps.id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          {...inputProps}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputProps.id}-error` : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-foreground placeholder:text-black/35 transition-colors focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40 ${
            isPassword ? "pr-12" : ""
          } ${error ? "border-red-500 focus:border-red-500" : "border-black/15 focus:border-navy"}`}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            disabled={inputProps.disabled}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-black/40 hover:text-black/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.86 21.86 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.86 21.86 0 0 1-3.22 4.44M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputProps.id}-error`} className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-sm text-black/45">{hint}</p>
      ) : null}
    </div>
  );
}
