import { montserrat } from "@/app/fonts";
import { locales } from "@/lib/i18n";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  return (
    <html lang={lang}>
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
