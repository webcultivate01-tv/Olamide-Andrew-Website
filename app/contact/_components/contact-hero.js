"use client";

import { useState } from "react";

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
  service: "",
  phone: "",
  message: "",
};

// Shared field chrome — hairline border, generous tap target, navy focus ring.
const FIELD =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base text-foreground placeholder:text-black/35 transition-colors focus:border-navy focus:outline-none";

const LABEL = "block text-sm font-semibold text-foreground";

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

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  // No backend yet — hand the filled-in details to the visitor's mail client.
  function handleSubmit(event) {
    event.preventDefault();

    const subject = form.company
      ? `New enquiry — ${form.name} (${form.company})`
      : `New enquiry — ${form.name}`;

    const body = [
      `Name: ${form.name}`,
      `Company: ${form.company || "—"}`,
      `Email: ${form.email}`,
      `Service: ${form.service || "—"}`,
      `Phone: ${form.phone || "—"}`,
      "",
      form.message,
    ].join("\n");

    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

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

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-6 max-w-[640px] rounded-[28px] border border-black/10 bg-white p-6 text-left md:mt-8 md:p-10"
      >
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
              className={FIELD}
            />
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
              className={FIELD}
            />
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
              className={FIELD}
            />
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
              className={`${FIELD} appearance-none pr-12 ${
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
              className={FIELD}
            />
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
              className={`${FIELD} mt-0 resize-y`}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="submit"
            className="font-nav inline-block bg-accent px-7 py-3.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-colors hover:bg-accent-hover lg:text-lg"
          >
            Send a message
          </button>
        </div>
      </form>
    </section>
  );
}
