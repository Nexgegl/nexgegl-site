import { ReactNode } from "react";
import { Montserrat, IBM_Plex_Sans_Arabic } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-en",
});

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ar",
});

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const safeLang = lang === "ar" ? "ar" : "en";

  return (
    <div
      dir={safeLang === "ar" ? "rtl" : "ltr"}
      className={`${montserrat.variable} ${arabicFont.variable} ${
        safeLang === "ar" ? "font-ar" : "font-en"
      }`}
    >
      {children}
    </div>
  );
}
