"use client";

import { useState } from "react";
import { subscribe } from "@/lib/api";
import { useToast } from "./toast";

/**
 * Shared by every newsletter form on the site: posts the email, raises a
 * toast on success, and reports back if the request failed. Layout and copy
 * stay with the caller - this only owns the request and its state.
 */
export function useNewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [toast, showToast] = useToast();

  const handleEmailChange = (value) => {
    setEmail(value);
    setSent(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError("");

    try {
      await subscribe(email);
      setSent(true);
      setEmail("");
      showToast("Thank you for signing up!");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return { email, handleEmailChange, loading, sent, error, handleSubmit, toast };
}
