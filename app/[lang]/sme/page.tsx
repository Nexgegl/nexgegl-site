import { dictionaries, Lang } from "../../dictionaries";

type SMEPageProps = {
  params: Promise<{
    lang: Lang;
  }>;
};

export default async function SMEPage({ params }: SMEPageProps) {
  const { lang } = await params;
  const dict = dictionaries[lang].SME;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#1a1a2e", // navy-950
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <section
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#2c2c54", // navy-800
          padding: "48px 40px",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        <h1
          style={{
            color: "#d5c7a3", // gold-400
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          {dict.title}
        </h1>

        <p
          style={{
            color: "#e6dec5", // gold-300
            fontSize: 16,
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          {dict.description}
        </p>

        <a
          href="https://forms.gle/jqVgur8n1oz79vTU6"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "#b59c5c", // gold-500
            color: "#1a1a2e",
            padding: "14px 28px",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          {dict.cta}
        </a>
      </section>
    </main>
  );
}
