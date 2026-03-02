const DIFF = [
  { title: "Apply with confidence.", body: "Your fit score tells you where you stand before you click apply." },
  { title: "Specific to you.", body: "Not generic advice — tailored to your profile and your target role." },
  { title: "Context, not noise.", body: "Not a social network — a career trajectory graph built for outcomes." },
  { title: "No black box.", body: "You see exactly why you match or don't. Transparent intelligence." },
];

export function WhyAscendSection() {
  return (
    <section className="bg-surface border-t border-border border-b border-border py-[120px] px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <p className="font-body text-[0.68rem] tracking-[0.22em] uppercase text-green mb-4">The difference</p>
          <h2 className="font-display font-bold text-ink text-[clamp(1.6rem,3vw,2.4rem)] leading-tight mb-5">
            The job market is intelligent now. Your tools should be too.
          </h2>
          <p className="font-body font-light text-[0.9rem] text-ink-3 leading-[1.85] italic">
            Every role you see on Ascend is matched to your profile before you even search.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
          {DIFF.map((d) => (
            <div key={d.title}>
              <h3 className="font-display font-semibold text-[0.9rem] text-ink mb-1.5">
                <span className="text-green">— </span>
                {d.title}
              </h3>
              <p className="font-body text-[0.82rem] text-ink-3 leading-[1.7]">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
