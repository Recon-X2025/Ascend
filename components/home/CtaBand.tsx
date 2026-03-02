import Link from "next/link";

export function CtaBand() {
  return (
    <section className="bg-green py-[88px] px-6 md:px-12 text-center">
      <h2 className="font-display font-bold text-white text-[clamp(1.6rem,3vw,2.2rem)] mb-7">
        Your next role is already in the system.
      </h2>
      <Link
        href="/auth/register"
        className="inline-flex items-center justify-center rounded-lg bg-white text-green-dark font-body font-semibold text-[0.95rem] px-[30px] py-[13px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-green-light transition-colors"
      >
        Get Started — It&apos;s Free →
      </Link>
    </section>
  );
}
