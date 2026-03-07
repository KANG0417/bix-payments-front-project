"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        {label ? (
          <label
            className={`mb-1.5 block text-sm font-medium transition-colors duration-200 ${
              isFocused
                ? "text-blue-600 dark:text-blue-400"
                : error
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400
            transition-all duration-200
            focus:outline-none
            ${
              error
                ? "border-red-500 ring-2 ring-red-200 dark:border-red-500 dark:ring-red-900/40"
                : isFocused
                  ? "border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900/40"
                  : "border-slate-300 dark:border-slate-600"
            }
            dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500
            ${className}
          `}
          {...props}
        />
        <div
          className={`overflow-hidden transition-all duration-200 ${
            error ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";
