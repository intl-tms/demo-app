"use client";

import { useTransition } from "react";
import { useExtracted, useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useExtracted();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Messages need to be statically analyzable to be extracted
  const localeNames: Record<(typeof routing.locales)[number], string> = {
    en: t("English"),
    da: t("Danish"),
  };

  return (
    <select
      aria-label={t("Change language")}
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
          {localeNames[cur]}
        </option>
      ))}
    </select>
  );
}
