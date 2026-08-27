import Link from "next/link";
import Image from "next/image";

// The card the four auth screens sit in: logo, title, subtitle, then the form.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-footer px-5 py-14 md:py-20">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" aria-label="Olamide — home">
            <Image src="/logo.png" alt="Olamide" width={56} height={56} className="h-12 w-12" />
          </Link>
          <p className="font-nav mt-5 text-xs font-bold tracking-[0.22em] text-muted uppercase">
            Admin Panel
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-7 shadow-sm md:p-9">
          <h1 className="font-headline text-3xl leading-none tracking-tight text-navy uppercase md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-black/60">{subtitle}</p>
          ) : null}

          <div className="mt-7">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-black/60">{footer}</div> : null}
      </div>
    </div>
  );
}
