"use client";

import { useNewsletterSignup } from "../../components/use-newsletter-signup";
import Toast from "../../components/toast";
import Reveal from "../../components/reveal";

export default function InsightsCta() {
  const { email, handleEmailChange, loading, sent, error, handleSubmit, toast } =
    useNewsletterSignup();

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20 lg:px-20 lg:pb-24">
      <Reveal
        as="div"
        variant="up"
        className="rounded-2xl border border-black/10 bg-footer px-6 py-10 sm:px-10 lg:px-14 lg:py-12"
      >
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-nav text-xs font-semibold tracking-[0.14em] text-black/55 uppercase">
              Looking to elevate your brand?
            </p>
            <p className="font-headline mt-2 max-w-[520px] text-3xl leading-[1.15] tracking-[-0.01em] text-foreground uppercase sm:text-4xl lg:text-[2.75rem]">
              Get insights on how to scale your{" "}
              <span className="text-accent">brand.</span>
            </p>
          </div>

          <div className="w-full max-w-[670px]">
            <form
              onSubmit={handleSubmit}
              className="flex w-full items-center gap-0 rounded-xl border border-black/10 bg-white p-1.5 shadow-sm sm:p-2"
            >
              <label htmlFor="insights-email" className="sr-only">
                Email
              </label>
              <input
                id="insights-email"
                type="email"
                required
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                placeholder="Enter Email"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-black/40 focus:outline-none sm:px-4"
              />
              <button
                type="submit"
                disabled={loading}
                className="font-nav shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold tracking-[0.04em] text-black uppercase transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing up…" : sent ? "Signed up" : "Sign me up"}
              </button>
            </form>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </Reveal>

      <Toast toast={toast} />
    </section>
  );
}
