"use client";

import { useMemo, useState } from "react";
import { dirForLanguage, t } from "@/i18n/messages";
import { useEditorStore } from "@/hooks/useEditorStore";

export function IconSidebar() {
  const language = useEditorStore((s) => s.language);
  const plan = useEditorStore((s) => s.plan);
  const iconAssets = useEditorStore((s) => s.iconAssets);
  const iconsCount = useEditorStore((s) => s.icons.length);
  const addCustomIconFromFile = useEditorStore((s) => s.addCustomIconFromFile);
  const addIconToCanvas = useEditorStore((s) => s.addIconToCanvas);

  const [error, setError] = useState<string | null>(null);

  const isDisabled = !plan;
  const helperText = useMemo(() => {
    if (plan) return t(language, "icons.helperWithPlan");
    return t(language, "icons.helperNoPlan");
  }, [language, plan]);

  return (
    <section className="flex flex-col gap-4 p-4" dir={dirForLanguage(language)} lang={language}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{t(language, "icons.heading")}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{helperText}</p>
        </div>
        <div className="shrink-0 rounded-md border border-zinc-200/70 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {t(language, "icons.placed", { count: iconsCount })}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t(language, "icons.uploadCustom")}</span>
        <input
          className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-90 dark:text-zinc-200"
          type="file"
          accept="image/*,.svg"
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (!file) return;

            setError(null);
            try {
              await addCustomIconFromFile(file);
            } catch {
              setError(t(language, "icons.iconUploadFailed"));
            }
          }}
        />
      </label>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {iconAssets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            disabled={isDisabled}
            onClick={async () => {
              setError(null);
              try {
                await addIconToCanvas(asset.id);
              } catch {
                setError(t(language, "icons.addFailed"));
              }
            }}
            className="group flex flex-col items-center gap-2 rounded-lg border border-zinc-200/70 bg-background p-2 text-left transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            title={
              isDisabled
                ? t(language, "icons.needPlanTitle")
                : t(language, "icons.addTitle", { name: asset.name })
            }
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-50 dark:bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.src}
                alt={asset.name}
                className="h-10 w-10 select-none"
                draggable={false}
              />
            </div>
            <div
              className="w-full text-center text-[11px] leading-tight text-zinc-700 dark:text-zinc-200"
              dir={dirForLanguage(language)}
              lang={language}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {asset.name}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
