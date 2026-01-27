import { ReactNode, use } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { dictionaries } from "../../dictionaries";

type SiteLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default function SiteLayout({ children, params }: SiteLayoutProps) {
  const { lang } = use(params);
  const safeLang = lang === "ar" ? "ar" : "en";
  const dict = dictionaries[safeLang];

  return (
    <div key={safeLang}>
      <Navbar lang={safeLang} dict={dict} />
      {children}
      <ScrollToTop />
      <Footer lang={safeLang} dict={dict} />
    </div>
  );
}
