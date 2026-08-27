// The main button on each form. While a request is in flight it is disabled
// and shows different text, so nobody submits the same thing twice.
export default function SubmitButton({ loading, loadingLabel, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="font-nav w-full bg-navy px-6 py-4 text-base font-bold tracking-[0.02em] text-white uppercase transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/40"
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
