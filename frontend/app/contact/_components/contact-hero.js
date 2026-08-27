"use client";

import { useState } from "react";
import { ApiError, submitEnquiry } from "@/lib/api";

const EMAIL = "ishola826@gmail.com";

const SERVICES = [
  "Brand Strategy",
  "Brand Identity & Design",
  "Rebrand / Repositioning",
  "Campaign & Marketing",
  "Something else",
];

const EMPTY_FORM = {
  name: "",
  company: "",
  email: "",
  subject: "",
  service: "",
  phone: "",
  message: "",
};

// Shared field chrome — hairline border, generous tap target, navy focus ring.
const FIELD =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3.5 text-base text-foreground placeholder:text-black/35 transition-colors focus:outline-none disabled:bg-black/[0.03] disabled:text-black/40";

const FIELD_OK = "border-black/15 focus:border-navy";
const FIELD_BAD = "border-red-500 focus:border-red-500";

const LABEL = "block text-sm font-semibold text-foreground";

// The message under a field the backend rejected. Declared out here rather
// than inside the form: a component created during render is a brand new type
// on every keystroke, and React would throw away and rebuild the DOM for it.
function FieldError({ name, message }) {
  if (!message) return null;

  return (
    <p id={`contact-${name}-error`} className="mt-2 text-sm text-red-600">
      {message}
    </p>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="pointer-events-none absolute right-4 bottom-4 h-5 w-5 text-black/40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

export default function ContactHero() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  // Goes to the API, which validates it, stores it, and notifies the admin
  // panel. The rules here are only there to catch an obvious slip before a
  // round trip — the backend re-checks every field, because nothing typed in
  // a browser can be trusted on the way in.
  async function handleSubmit(event) {
    event.preventDefault();

    setSending(true);
    setError("");
    setFieldErrors({});

    try {
      await submitEnquiry(form);
      setSent(true);
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(submitError.message);
      if (submitError instanceof ApiError && submitError.errors) {
        setFieldErrors(submitError.errors);
      }
    } finally {
      setSending(false);
    }
  }

  // Picks the border colour for a field, and wires up the message underneath.
  const fieldProps = (name) => ({
    className: `${FIELD} ${fieldErrors[name] ? FIELD_BAD : FIELD_OK}`,
    "aria-invalid": fieldErrors[name] ? true : undefined,
    "aria-describedby": fieldErrors[name] ? `contact-${name}-error` : undefined,
    disabled: sending,
  });

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 text-center md:px-10 md:py-24 lg:px-20">
      {/* Fixed two-line break — the second line is the longest, so the base
          size is set to keep it on one line at 360px wide. Anton's caps fill
          ~0.71em of the line box, so 1.22 leading leaves a clear band of white
          between the two lines. */}
      <h1 className="font-headline text-[2.25rem] leading-[1.22] tracking-[-0.01em] text-foreground uppercase sm:text-[4rem] md:text-[5rem] lg:text-[5.5rem]">
        <span className="block">Ready to build</span>
        <span className="block">Something impactful?</span>
      </h1>

      <p className="mx-auto mt-6 max-w-[720px] text-lg leading-relaxed text-black/70 md:mt-8 md:text-xl">
        Whether you&apos;re building a new brand, repositioning an existing one,
        or simply exploring what&apos;s next, I&apos;d love to hear about your
        business and where you want it to go
      </p>

      <h2 className="font-headline mt-12 text-2xl tracking-[-0.01em] text-foreground uppercase md:mt-16 md:text-[1.75rem]">
        Start a conversation
      </h2>

      {sent ? (
        <div
          role="status"
          className="mx-auto mt-6 max-w-[640px] rounded-[28px] border border-black/10 bg-white p-10 md:mt-8 md:p-14"
        >
          <h3 className="font-headline text-3xl tracking-[-0.01em] text-navy uppercase">
            Message received
          </h3>
          <p className="mx-auto mt-5 max-w-[46ch] text-base leading-relaxed text-black/65">
            Thanks for getting in touch — your enquiry has landed and I&apos;ll
            come back to you shortly. If it&apos;s urgent, reach me directly at{" "}
            <a href={`mailto:${EMAIL}`} className="font-semibold text-navy hover:underline">
              {EMAIL}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-nav mt-8 inline-block border border-black/15 px-6 py-3 text-sm font-bold tracking-[0.02em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-6 max-w-[640px] rounded-[28px] border border-black/10 bg-white p-6 text-left md:mt-8 md:p-10"
        >
          {error ? (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-5">
            <div>
              <label htmlFor="contact-name" className={LABEL}>
                Full Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="John"
                value={form.name}
                onChange={update("name")}
                {...fieldProps("name")}
              />
              <FieldError name="name" message={fieldErrors.name} />
            </div>

            <div>
              <label htmlFor="contact-company" className={LABEL}>
                Company
              </label>
              <input
                id="contact-company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Microsoft.Inc"
                value={form.company}
                onChange={update("company")}
                {...fieldProps("company")}
              />
              <FieldError name="company" message={fieldErrors.company} />
            </div>

            <div>
              <label htmlFor="contact-email" className={LABEL}>
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={update("email")}
                {...fieldProps("email")}
              />
              <FieldError name="email" message={fieldErrors.email} />
            </div>

            <div>
              <label htmlFor="contact-subject" className={LABEL}>
                Subject
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                placeholder="New brand identity"
                value={form.subject}
                onChange={update("subject")}
                {...fieldProps("subject")}
              />
              <FieldError name="subject" message={fieldErrors.subject} />
            </div>

            <div className="relative">
              <label htmlFor="contact-service" className={LABEL}>
                Services
              </label>
              <select
                id="contact-service"
                name="service"
                value={form.service}
                onChange={update("service")}
                {...fieldProps("service")}
                className={`${fieldProps("service").className} appearance-none pr-12 ${
                  form.service ? "text-foreground" : "text-black/35"
                }`}
              >
                <option value="">Select Service</option>
                {SERVICES.map((service) => (
                  <option key={service} value={service} className="text-foreground">
                    {service}
                  </option>
                ))}
              </select>
              <ChevronDown />
              <FieldError name="service" message={fieldErrors.service} />
            </div>

            <div>
              <label htmlFor="contact-phone" className={LABEL}>
                Phone
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={update("phone")}
                {...fieldProps("phone")}
              />
              <FieldError name="phone" message={fieldErrors.phone} />
            </div>

            <div>
              <label htmlFor="contact-message" className="sr-only">
                Tell me about your project
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                placeholder="What does your business do? What are you hoping to achieve? Is there a challenge you're trying to solve?"
                value={form.message}
                onChange={update("message")}
                {...fieldProps("message")}
                className={`${fieldProps("message").className} mt-0 resize-y`}
              />
              <FieldError name="message" message={fieldErrors.message} />
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={sending}
              className="font-nav inline-block bg-accent px-7 py-3.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-accent/40 lg:text-lg"
            >
              {sending ? "Sending…" : "Send a message"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
