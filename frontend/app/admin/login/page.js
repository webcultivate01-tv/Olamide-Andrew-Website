"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, getCurrentAdmin, ApiError } from "@/lib/api";
import AuthShell from "../_components/auth-shell";
import FormField from "../_components/form-field";
import FormAlert from "../_components/form-alert";
import SubmitButton from "../_components/submit-button";

// Where to go after logging in. proxy.js puts the page they originally wanted
// in ?next=. Only /admin paths are accepted, so a crafted link such as
// ?next=https://evil.example cannot bounce anyone off the site.
//
// This reads the URL directly instead of using the useSearchParams hook. That
// hook would stop this page being pre-rendered, leaving an empty card on
// screen until the JavaScript loaded.
const getNextPath = () => {
  const requested = new URLSearchParams(window.location.search).get("next");

  if (requested && requested.startsWith("/admin/")) {
    return requested;
  }
  return "/admin/dashboard";
};

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // If a valid session already exists, skip the form. Asking the API is the
  // only reliable way to know, because the cookie cannot be read from
  // JavaScript.
  useEffect(() => {
    getCurrentAdmin()
      .then(() => {
        router.replace(getNextPath());
      })
      .catch(() => {
        // Not logged in, which is the normal case here. Show the form.
      });
  }, [router]);

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setLoading(true);

    try {
      await login(form.email, form.password);

      // The API has set the session cookie. router.refresh() makes the server
      // re-render with it before we move to the dashboard.
      router.refresh();
      router.replace(getNextPath());
    } catch (error) {
      setMessage(error.message);
      if (error instanceof ApiError && error.errors) {
        setFieldErrors(error.errors);
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Enter your admin credentials to continue.">
      <FormAlert message={message} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="admin@gmail.com"
          autoComplete="email"
          value={form.email}
          onChange={updateField("email")}
          disabled={loading}
          error={fieldErrors.email}
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="********"
          autoComplete="current-password"
          value={form.password}
          onChange={updateField("password")}
          disabled={loading}
          error={fieldErrors.password}
        />

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Signing in...">
            Sign in
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/admin/forgot-password" className="font-semibold text-navy hover:underline">
          Forgot password?
        </Link>
      </p>
    </AuthShell>
  );
}
