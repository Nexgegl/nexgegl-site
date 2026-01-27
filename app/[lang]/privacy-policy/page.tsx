import { dictionaries } from "../../dictionaries";

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: "ar" | "en" }>;
}) {
  const { lang } = await params;

  const dict = dictionaries[lang];
  const p = dict.privacyPolicy;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />

      <div className="relative container mx-auto max-w-4xl px-4">
        <article
          className="
            backdrop-blur-sm
            dark:bg-navy-900/70
            border border-white/10
            rounded-xl
            px-8 py-10
            shadow-xl
            prose prose-neutral dark:prose-invert max-w-none
          "
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          <h1>{p.title}</h1>
          <p className="text-sm text-muted-foreground">{p.version}</p>

          <div className="whitespace-pre-wrap leading-relaxed mt-8">
            {p.content}
          </div>
        </article>
      </div>
    </main>
  );
}
