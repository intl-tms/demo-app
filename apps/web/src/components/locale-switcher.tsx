"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      aria-label={t("label")}
      value={locale}
      disabled={isPending}
      onChange={(event) => {
        const nextLocale = event.target.value;
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale });
        });
      }}
      className="h-9 rounded-full border border-solid border-black/[.08] bg-transparent px-3 text-sm font-medium text-black transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
    >
      {routing.locales.map((cur) => (
        <option key={cur} value={cur}>
          {t(`locales.${cur}`)}
        </option>
      ))}
    </select>
  );
}
