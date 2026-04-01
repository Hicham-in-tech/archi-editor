"use client";

import { useEffect, useState } from "react";
import { dirForLanguage, t } from "@/i18n/messages";
import { useEditorStore } from "@/hooks/useEditorStore";

export function UploadImage() {
  const language = useEditorStore((s) => s.language);
  const plan = useEditorStore((s) => s.plan);
  const isPlanLoading = useEditorStore((s) => s.isPlanLoading);
  const setPlanFromFile = useEditorStore((s) => s.setPlanFromFile);
  const loadSamplePlan1 = useEditorStore((s) => s.loadSamplePlan1);
  const clearPlan = useEditorStore((s) => s.clearPlan);

  const projectName = useEditorStore((s) => s.projectName);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const savedProjects = useEditorStore((s) => s.savedProjects);
  const refreshSavedProjects = useEditorStore((s) => s.refreshSavedProjects);
  const saveProjectToBrowser = useEditorStore((s) => s.saveProjectToBrowser);
  const loadProjectFromBrowser = useEditorStore((s) => s.loadProjectFromBrowser);

  const [error, setError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  useEffect(() => {
    refreshSavedProjects();
  }, [refreshSavedProjects]);

  useEffect(() => {
    if (selectedProjectKey) return;
    const first = savedProjects[0];
    if (!first) return;
    setSelectedProjectKey(first.key);
  }, [savedProjects, selectedProjectKey]);

  const isProjectBusy = isSavingProject || isLoadingProject;

  return (
    <section className="flex flex-col gap-4 p-4" dir={dirForLanguage(language)} lang={language}>
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{t(language, "plan.heading")}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t(language, "plan.description")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200/70 bg-background px-3 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          disabled={isPlanLoading}
          onClick={async () => {
            setError(null);
            try {
              await loadSamplePlan1();
            } catch {
              setError(t(language, "plan.loadSample1Error"));
            }
          }}
        >
          {t(language, "plan.loadSample1")}
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t(language, "plan.uploadLabel")}</span>
        <input
          className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-90 dark:text-zinc-200"
          type="file"
          accept="image/*"
          disabled={isPlanLoading}
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (!file) return;

            setError(null);
            try {
              await setPlanFromFile(file);
            } catch {
              setError(t(language, "plan.uploadError"));
            }
          }}
        />
      </label>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200/70 bg-background p-3 dark:border-zinc-800">
        <div className="text-sm font-semibold tracking-tight">{t(language, "project.heading")}</div>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t(language, "project.nameLabel")}
            </span>
            <input
              className="h-9 w-full rounded-md border border-zinc-200/70 bg-background px-3 text-sm text-zinc-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-zinc-400/60 dark:border-zinc-800 dark:text-zinc-100"
              value={projectName}
              onChange={(e) => setProjectName(e.currentTarget.value)}
              placeholder={
                plan ? plan.name.replace(/\.[^/.]+$/, "") : t(language, "project.untitled")
              }
            />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200/70 bg-background px-3 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                disabled={!plan || isPlanLoading || isProjectBusy}
                onClick={async () => {
                  if (!plan) return;
                  setProjectError(null);
                  setIsSavingProject(true);
                  try {
                    const nameUsed =
                      projectName.trim() ||
                      plan.name.replace(/\.[^/.]+$/, "").trim() ||
                      t(language, "project.untitled");
                    await saveProjectToBrowser();
                    setSelectedProjectKey(encodeURIComponent(nameUsed));
                  } catch {
                    setProjectError(t(language, "project.saveError"));
                  } finally {
                    setIsSavingProject(false);
                  }
                }}
              >
                {isSavingProject ? t(language, "project.saving") : t(language, "project.save")}
              </button>

              <select
                className="h-9 min-w-0 flex-1 rounded-md border border-zinc-200/70 bg-background px-2 text-sm text-zinc-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-zinc-400/60 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-100"
                value={selectedProjectKey}
                onChange={(e) => setSelectedProjectKey(e.currentTarget.value)}
                disabled={savedProjects.length === 0 || isProjectBusy}
                title={
                  savedProjects.length === 0
                    ? t(language, "project.selectTitleEmpty")
                    : t(language, "project.selectTitle")
                }
              >
                {savedProjects.length === 0 ? (
                  <option value="">{t(language, "project.noSaved")}</option>
                ) : (
                  savedProjects.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200/70 bg-background px-3 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                disabled={!selectedProjectKey || isProjectBusy}
                onClick={async () => {
                  if (!selectedProjectKey) return;
                  setProjectError(null);
                  setIsLoadingProject(true);
                  try {
                    await loadProjectFromBrowser(selectedProjectKey);
                  } catch {
                    setProjectError(t(language, "project.loadError"));
                  } finally {
                    setIsLoadingProject(false);
                  }
                }}
              >
                {isLoadingProject ? t(language, "project.loading") : t(language, "project.load")}
              </button>
            </div>

            {projectError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {projectError}
              </div>
            )}

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(language, "project.browserOnly")}
            </div>
          </div>
        </div>
      </div>

      {plan ? (
        <div className="rounded-lg border border-zinc-200/70 bg-background p-3 dark:border-zinc-800">
          <div className="text-sm font-medium">{plan.name}</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {plan.width} × {plan.height}px
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200/70 bg-background px-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              onClick={clearPlan}
            >
              {t(language, "plan.remove")}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          {t(language, "plan.noneYet")}
        </div>
      )}
    </section>
  );
}
