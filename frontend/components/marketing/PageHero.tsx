export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="absolute inset-0 bg-[radial-gradient(50%_80%_at_90%_0%,rgba(30,153,142,0.10),transparent_70%)]" />
      <div className="container-page relative py-16 sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-3 max-w-3xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
