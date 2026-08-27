"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword, ApiError } from "@/lib/api";
import AuthShell from "../_components/auth-shell";
import FormField from "../_components/form-field";
import FormAlert from "../_components/form-alert";
import SubmitButton from "../_components/submit-button";

// Step 1 of 3: ask for the email address and have an OTP sent to it.
export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setLoading(true);

    try {
      await forgotPassword(email);

      // Carry the email to the next screen so it does not have to be typed
      // again. sessionStorage clears itself when the tab closes.
      sessionStorage.setItem("admin_reset_email", email.trim().toLowerCase());
      router.push("/admin/verify-otp");
    } catch (error) {
      setMessage(error.message);
      if (error instanceof ApiError && error.errors) {
        setFieldErrors(error.errors);
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your registered email address and we will send you a 6-digit code."
    >
      <FormAlert message={message} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="admin@gmail.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          error={fieldErrors.email}
        />

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Sending code…">
            Send code
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
