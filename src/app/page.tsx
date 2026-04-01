"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { IconSidebar } from "@/components/IconSidebar";
import { Toolbar } from "@/components/Toolbar";
import { UploadImage } from "@/components/UploadImage";
import { useEditorStore } from "@/hooks/useEditorStore";
import { dirForLanguage, t } from "@/i18n/messages";

const CanvasEditor = dynamic(
  () => import("@/components/CanvasEditor").then((m) => m.CanvasEditor),
  { ssr: false }
);

export default function Home() {
  const isPreview = useEditorStore((s) => s.isPreview);
  const language = useEditorStore((s) => s.language);
  const hasPlan = useEditorStore((s) => !!s.plan);

  const [mobileTab, setMobileTab] = useState<"plan" | "icons">(() =>
    hasPlan ? "icons" : "plan"
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Toolbar />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-0 flex-1 lg:order-2 lg:border-x lg:border-zinc-200/70 lg:dark:border-zinc-800">
          <CanvasEditor />
        </main>

        {!isPreview && (
          <div
            className="flex h-[40vh] min-h-[260px] shrink-0 flex-col border-t border-zinc-200/70 bg-background dark:border-zinc-800 lg:contents lg:h-auto lg:min-h-0 lg:border-t-0 lg:bg-transparent"
            dir={dirForLanguage(language)}
            lang={language}
          >
            {/* Mobile tabs */}
            <div className="p-3 lg:hidden">
              <div className="flex w-full rounded-lg border border-zinc-200/70 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setMobileTab("plan")}
                  className={
                    mobileTab === "plan"
                      ? "flex-1 rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
                      : "flex-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  }
                  aria-pressed={mobileTab === "plan"}
                >
                  {t(language, "plan.heading")}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("icons")}
                  className={
                    mobileTab === "icons"
                      ? "flex-1 rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
                      : "flex-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  }
                  aria-pressed={mobileTab === "icons"}
                >
                  {t(language, "icons.heading")}
                </button>
              </div>
            </div>

            {/* Plan panel (desktop left, mobile tab) */}
            <aside
              className={`min-h-0 flex-1 overflow-hidden ${
                mobileTab === "plan" ? "block" : "hidden"
              } lg:order-1 lg:block lg:w-80 lg:flex-none lg:bg-background`}
            >
              <div className="h-full overflow-y-auto">
                <UploadImage />
              </div>
            </aside>

            {/* Icons panel (desktop right, mobile tab) */}
            <aside
              className={`min-h-0 flex-1 overflow-hidden ${
                mobileTab === "icons" ? "block" : "hidden"
              } lg:order-3 lg:block lg:w-80 lg:flex-none lg:bg-background`}
            >
              <div className="h-full overflow-y-auto">
                <IconSidebar />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
