// The banner at the top of a form: red for an error, green for success.
// role="alert" makes a screen reader announce it as soon as it appears.
export default function FormAlert({ type = "error", message }) {
  if (!message) return null;

  const styles =
    type === "success"
      ? "border-green-600/25 bg-green-50 text-green-800"
      : "border-red-500/25 bg-red-50 text-red-700";

  return (
    <div role="alert" className={`mb-6 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}
