"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword, ApiError } from "@/lib/api";
import AuthShell from "../_components/auth-shell";
import FormField from "../_components/form-field";
import FormAlert from "../_components/form-alert";
import SubmitButton from "../_components/submit-button";

// Step 3 of 3: choose the new password.
export default function ResetPasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // The token is saved by the verify step. Without it the OTP was never
  // checked, so send them back to the start.
  useEffect(() => {
    if (!sessionStorage.getItem("admin_reset_token")) {
      router.replace("/admin/forgot-password");
    }
  }, [router]);

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setLoading(true);

    const resetToken = sessionStorage.getItem("admin_reset_token");
    if (!resetToken) {
      router.replace("/admin/forgot-password");
      return;
    }

    try {
      await resetPassword({
        resetToken,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      // The token is spent now, so clear both values out of the tab.
      sessionStorage.removeItem("admin_reset_email");
      sessionStorage.removeItem("admin_reset_token");

      setDone(true);
      setLoading(false);
    } catch (error) {
      setMessage(error.message);
      if (error instanceof ApiError && error.errors) {
        setFieldErrors(error.errors);
      }
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password.">
        <FormAlert type="success" message="Password reset successfully." />
        <Link
          href="/admin/login"
          className="font-nav block w-full bg-navy px-6 py-4 text-center text-base font-bold tracking-[0.02em] text-white uppercase transition-colors hover:bg-navy/90"
        >
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="New password" subtitle="Choose a password you have not used before.">
      <FormAlert message={message} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="newPassword"
          name="newPassword"
          type="password"
          label="New password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={updateField("newPassword")}
          disabled={loading}
          error={fieldErrors.newPassword}
          hint="At least 8 characters, with an uppercase letter, a number and a symbol."
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={updateField("confirmPassword")}
          disabled={loading}
          error={fieldErrors.confirmPassword}
        />

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Updating…">
            Update password
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="font-semibold text-navy hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
