"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyOtp, ApiError } from "@/lib/api";
import AuthShell from "../_components/auth-shell";
import FormField from "../_components/form-field";
import FormAlert from "../_components/form-alert";
import SubmitButton from "../_components/submit-button";

// Step 2 of 3: type in the code from the email.
export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // The email was saved by the previous screen. Landing here directly means
  // there is nothing to verify, so start the flow from the beginning.
  useEffect(() => {
    if (!sessionStorage.getItem("admin_reset_email")) {
      router.replace("/admin/forgot-password");
    }
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setLoading(true);

    const email = sessionStorage.getItem("admin_reset_email");
    if (!email) {
      router.replace("/admin/forgot-password");
      return;
    }

    try {
      const response = await verifyOtp(email, otp);

      // The reset token is what proves the code was correct. The next screen
      // sends it back to the API along with the new password.
      sessionStorage.setItem("admin_reset_token", response.data.resetToken);
      router.push("/admin/reset-password");
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
      title="Enter code"
      subtitle="We sent a 6-digit code to your email address. It expires in 10 minutes."
    >
      <FormAlert message={message} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="otp"
          name="otp"
          type="text"
          label="6-digit code"
          placeholder="000000"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          // Strip anything that is not a digit, so pasting "483 921" still works.
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          disabled={loading}
          error={fieldErrors.otp}
        />

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Verifying…">
            Verify code
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-black/60">
        Didn&apos;t get the email?{" "}
        <Link href="/admin/forgot-password" className="font-semibold text-navy hover:underline">
          Send a new code
        </Link>
      </p>
    </AuthShell>
  );
}
