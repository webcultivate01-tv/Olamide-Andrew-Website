// One labelled input, with room for a per-field error message underneath.
export default function FormField({ label, error, hint, ...inputProps }) {
  return (
    <div>
      <label htmlFor={inputProps.id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>

      <input
        {...inputProps}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputProps.id}-error` : undefined}
        className={`mt-2 w-full rounded-xl border bg-white px-4 py-3.5 text-base text-foreground placeholder:text-black/35 transition-colors focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40 ${
          error ? "border-red-500 focus:border-red-500" : "border-black/15 focus:border-navy"
        }`}
      />

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
