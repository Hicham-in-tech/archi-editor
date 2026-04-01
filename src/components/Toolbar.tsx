"use client";

import { useEffect, useMemo, useState } from "react";
import { dirForLanguage, LANGUAGE_LABELS, t, type Language } from "@/i18n/messages";
import { useEditorStore } from "@/hooks/useEditorStore";

type ButtonVariant = "default" | "primary";

function Button({
  children,
  disabled,
  onClick,
  title,
  variant = "default",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  variant?: ButtonVariant;
}) {
  const base =
    "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 disabled:pointer-events-none disabled:opacity-50";

  const styles =
    variant === "primary"
      ? "bg-foreground text-background hover:opacity-90"
      : "border border-zinc-200/70 bg-background hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900";

  return (
    <button
      type="button"
      className={`${base} ${styles}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const language = useEditorStore((s) => s.language);
  const theme = useEditorStore((s) => s.theme);
  const hydratePreferences = useEditorStore((s) => s.hydratePreferences);
  const setLanguage = useEditorStore((s) => s.setLanguage);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);

  const plan = useEditorStore((s) => s.plan);
  const isPlanLoading = useEditorStore((s) => s.isPlanLoading);
  const selectedIconId = useEditorStore((s) => s.selectedIconId);
  const selectedIconName = useEditorStore((s) =>
    s.selectedIconId ? s.icons.find((i) => i.id === s.selectedIconId)?.name ?? null : null
  );
  const viewport = useEditorStore((s) => s.viewport);
  const isPreview = useEditorStore((s) => s.isPreview);
  const showLegend = useEditorStore((s) => s.showLegend);

  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const fitToPlan = useEditorStore((s) => s.fitToPlan);
  const togglePreview = useEditorStore((s) => s.togglePreview);
  const deleteSelectedIcon = useEditorStore((s) => s.deleteSelectedIcon);
  const scaleSelectedIcon = useEditorStore((s) => s.scaleSelectedIcon);
  const toggleLegend = useEditorStore((s) => s.toggleLegend);
  const exportPlanAsPng = useEditorStore((s) => s.exportPlanAsPng);
  const exportPlanAsPdf = useEditorStore((s) => s.exportPlanAsPdf);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const zoomLabel = useMemo(() => `${Math.round(viewport.scale * 100)}%`, [viewport.scale]);

  const hasPlan = !!plan;
  const canEdit = hasPlan && !isPreview;

  const onExportPng = async () => {
    if (!hasPlan) return;
    setExportError(null);
    setIsExporting(true);
    try {
      await exportPlanAsPng();
    } catch {
      setExportError(t(language, "toolbar.exportPngFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  const onExportPdf = async () => {
    if (!hasPlan) return;
    setExportError(null);
    setIsExporting(true);
    try {
      await exportPlanAsPdf();
    } catch {
      setExportError(t(language, "toolbar.exportPdfFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    hydratePreferences();
  }, [hydratePreferences]);

  return (
    <header
      className="shrink-0 border-b border-zinc-200/70 bg-background dark:border-zinc-800"
      dir={dirForLanguage(language)}
      lang={language}
    >
      <div className="flex flex-col gap-3 px-4 py-2 sm:h-14 sm:flex-row sm:items-center sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">
              {t(language, "app.title")}
            </div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {plan
                ? plan.name
                : isPlanLoading
                  ? t(language, "app.subtitle.loading")
                  : t(language, "app.subtitle.noPlan")}
            </div>
          </div>

          {canEdit && selectedIconName && (
            <div className="hidden rounded-md border border-zinc-200/70 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 sm:block">
              {t(language, "toolbar.selected", { name: selectedIconName })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-zinc-200/70 bg-background px-2 text-sm text-zinc-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-zinc-400/60 dark:border-zinc-800 dark:text-zinc-100"
            value={language}
            onChange={(e) => setLanguage(e.currentTarget.value as Language)}
            title={t(language, "toolbar.languageTitle")}
          >
            <option value="en">{LANGUAGE_LABELS.en}</option>
            <option value="fr">{LANGUAGE_LABELS.fr}</option>
            <option value="ar">{LANGUAGE_LABELS.ar}</option>
          </select>

          <Button onClick={toggleTheme} title={t(language, "toolbar.themeTitle")}
            >
            {theme === "dark"
              ? t(language, "toolbar.themeDark")
              : t(language, "toolbar.themeLight")}
          </Button>

          <div className="mx-1 hidden h-6 w-px bg-zinc-200/70 dark:bg-zinc-800 sm:block" />

          <Button
            onClick={fitToPlan}
            disabled={!hasPlan}
            title={t(language, "toolbar.fitTitle")}
          >
            {t(language, "toolbar.fit")}
          </Button>
          <Button
            onClick={zoomOut}
            disabled={!hasPlan}
            title={t(language, "toolbar.zoomOutTitle")}
          >
            −
          </Button>
          <div className="w-14 text-center text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
            {zoomLabel}
          </div>
          <Button
            onClick={zoomIn}
            disabled={!hasPlan}
            title={t(language, "toolbar.zoomInTitle")}
          >
            +
          </Button>

          <div className="mx-1 h-6 w-px bg-zinc-200/70 dark:bg-zinc-800" />

          {canEdit && selectedIconId && (
            <>
              <Button
                onClick={() => scaleSelectedIcon(1 / 1.15)}
                disabled={!selectedIconId}
                title={t(language, "toolbar.iconSmallerTitle")}
              >
                {t(language, "toolbar.iconSmaller")}
              </Button>
              <Button
                onClick={() => scaleSelectedIcon(1.15)}
                disabled={!selectedIconId}
                title={t(language, "toolbar.iconBiggerTitle")}
              >
                {t(language, "toolbar.iconBigger")}
              </Button>
            </>
          )}

          <Button
            onClick={deleteSelectedIcon}
            disabled={!canEdit || !selectedIconId}
            title={t(language, "toolbar.deleteTitle")}
          >
            {t(language, "toolbar.delete")}
          </Button>

          <div className="mx-1 hidden h-6 w-px bg-zinc-200/70 dark:bg-zinc-800 sm:block" />

          <Button
            onClick={toggleLegend}
            disabled={!hasPlan}
            title={t(language, "toolbar.legendTitle")}
          >
            {showLegend
              ? t(language, "toolbar.legendOn")
              : t(language, "toolbar.legendOff")}
          </Button>

          <Button
            onClick={onExportPng}
            disabled={!hasPlan || isExporting}
            title={t(language, "toolbar.exportPngTitle")}
          >
            PNG
          </Button>
          <Button
            onClick={onExportPdf}
            disabled={!hasPlan || isExporting}
            title={t(language, "toolbar.exportPdfTitle")}
          >
            PDF
          </Button>

          {exportError && (
            <div
              className="hidden max-w-44 truncate text-xs text-red-700 dark:text-red-300 sm:block"
              title={exportError}
            >
              {exportError}
            </div>
          )}

          <Button
            variant="primary"
            onClick={togglePreview}
            disabled={!hasPlan}
            title={
              isPreview
                ? t(language, "toolbar.previewExitTitle")
                : t(language, "toolbar.previewEnterTitle")
            }
          >
            {isPreview
              ? t(language, "toolbar.previewExit")
              : t(language, "toolbar.previewEnter")}
          </Button>
        </div>
      </div>
    </header>
  );
}
