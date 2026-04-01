"use client";

import dynamic from "next/dynamic";
import { IconSidebar } from "@/components/IconSidebar";
import { Toolbar } from "@/components/Toolbar";
import { UploadImage } from "@/components/UploadImage";
import { useEditorStore } from "@/hooks/useEditorStore";

const CanvasEditor = dynamic(
  () => import("@/components/CanvasEditor").then((m) => m.CanvasEditor),
  { ssr: false }
);

export default function Home() {
  const isPreview = useEditorStore((s) => s.isPreview);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Toolbar />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {!isPreview && (
          <aside className="w-full shrink-0 border-b border-zinc-200/70 bg-background dark:border-zinc-800 lg:w-80 lg:border-b-0">
            <div className="max-h-72 overflow-y-auto lg:h-full lg:max-h-none">
              <UploadImage />
            </div>
          </aside>
        )}

        <main className="min-h-0 flex-1 h-[55vh] lg:h-auto lg:border-x lg:border-zinc-200/70 lg:dark:border-zinc-800">
          <CanvasEditor />
        </main>

        {!isPreview && (
          <aside className="w-full shrink-0 border-t border-zinc-200/70 bg-background dark:border-zinc-800 lg:w-80 lg:border-t-0">
            <div className="max-h-72 overflow-y-auto lg:h-full lg:max-h-none">
              <IconSidebar />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
