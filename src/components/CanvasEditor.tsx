"use client";

import {
  Fragment,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";
import { dirForLanguage, t } from "@/i18n/messages";
import { useEditorStore } from "@/hooks/useEditorStore";

function readCssVar(varName: "--foreground" | "--background", fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

function hexToRgba(hex: string, alpha: number) {
  const raw = hex.trim();
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  const isShort = normalized.length === 3;
  const value = isShort
    ? normalized
        .split("")
        .map((c) => c + c)
        .join("")
    : normalized;

  if (value.length !== 6) return raw;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CanvasEditor() {
  const language = useEditorStore((s) => s.language);
  const theme = useEditorStore((s) => s.theme);
  const plan = useEditorStore((s) => s.plan);
  const icons = useEditorStore((s) => s.icons);
  const selectedIconId = useEditorStore((s) => s.selectedIconId);
  const isPreview = useEditorStore((s) => s.isPreview);
  const showLegend = useEditorStore((s) => s.showLegend);
  const viewport = useEditorStore((s) => s.viewport);

  const setStageSize = useEditorStore((s) => s.setStageSize);
  const setViewport = useEditorStore((s) => s.setViewport);
  const zoomAtPoint = useEditorStore((s) => s.zoomAtPoint);
  const fitToPlan = useEditorStore((s) => s.fitToPlan);
  const selectIcon = useEditorStore((s) => s.selectIcon);
  const updateIconPosition = useEditorStore((s) => s.updateIconPosition);

  const foregroundColor = readCssVar(
    "--foreground",
    theme === "dark" ? "#ededed" : "#171717"
  );
  const backgroundColor = readCssVar(
    "--background",
    theme === "dark" ? "#0a0a0a" : "#ffffff"
  );
  const selectionStroke = foregroundColor;

  const planSrc = plan?.src ?? null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  const [stageSize, setLocalStageSize] = useState({ width: 0, height: 0 });

  const isPanningRef = useRef(false);
  const panOriginRef = useRef<
    | {
        pointer: { x: number; y: number };
        viewport: { x: number; y: number };
      }
    | null
  >(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setLocalStageSize({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(height)),
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) return;
    setStageSize(stageSize);
  }, [setStageSize, stageSize]);

  useEffect(() => {
    if (!planSrc) return;
    if (stageSize.width <= 0 || stageSize.height <= 0) return;
    fitToPlan();
  }, [fitToPlan, planSrc, stageSize.width, stageSize.height]);

  const showStage = useMemo(
    () => !!plan && stageSize.width > 0 && stageSize.height > 0,
    [plan, stageSize.height, stageSize.width]
  );

  const legendItems = useMemo(() => {
    if (!showLegend) return [] as Array<{ key: string; name: string; count: number; image: HTMLImageElement }>;
    const map = new Map<string, { key: string; name: string; count: number; image: HTMLImageElement }>();
    for (const icon of icons) {
      const existing = map.get(icon.assetId);
      if (existing) {
        existing.count += 1;
        continue;
      }
      map.set(icon.assetId, {
        key: icon.assetId,
        name: icon.name,
        count: 1,
        image: icon.image,
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, language));
  }, [icons, language, showLegend]);

  const startPan = () => {
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;

    isPanningRef.current = true;
    panOriginRef.current = {
      pointer,
      viewport: { x: viewport.x, y: viewport.y },
    };
  };

  const updatePan = () => {
    if (!isPanningRef.current) return;
    if (!panOriginRef.current) return;

    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;

    const { pointer: startPointer, viewport: startViewport } = panOriginRef.current;
    setViewport({
      x: startViewport.x + (pointer.x - startPointer.x),
      y: startViewport.y + (pointer.y - startPointer.y),
    });
  };

  const endPan = () => {
    isPanningRef.current = false;
    panOriginRef.current = null;
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {!plan && (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100 px-6 text-center dark:bg-zinc-900">
          <div className="max-w-md rounded-xl border border-zinc-200/70 bg-background p-6 shadow-sm dark:border-zinc-800">
            <div className="text-base font-semibold tracking-tight">
              {t(language, "canvas.emptyTitle")}
            </div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t(language, "canvas.emptyText")}
            </div>
          </div>
        </div>
      )}

      {showStage && plan && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          x={viewport.x}
          y={viewport.y}
          onWheel={(e) => {
            e.evt.preventDefault();
            const stage = e.target.getStage();
            const pointer = stage?.getPointerPosition();
            if (!pointer) return;
            const scaleBy = e.evt.deltaY > 0 ? 1 / 1.1 : 1.1;
            zoomAtPoint(pointer, scaleBy);
          }}
          onMouseDown={(e) => {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (!clickedOnEmpty) return;
            selectIcon(null);
            startPan();
          }}
          onMouseMove={() => updatePan()}
          onMouseUp={() => endPan()}
          onMouseLeave={() => endPan()}
          onTouchStart={(e) => {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (!clickedOnEmpty) return;
            selectIcon(null);
            startPan();
          }}
          onTouchMove={() => updatePan()}
          onTouchEnd={() => endPan()}
        >
          <Layer>
            <KonvaImage
              image={plan.image}
              x={0}
              y={0}
              width={plan.width}
              height={plan.height}
              listening={false}
            />

            {icons.map((icon) => (
              <Fragment key={icon.id}>
                <Group
                  x={icon.x}
                  y={icon.y}
                  draggable={!isPreview}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    selectIcon(icon.id);
                  }}
                  onTouchStart={(e) => {
                    e.cancelBubble = true;
                    selectIcon(icon.id);
                  }}
                  onDragStart={() => selectIcon(icon.id)}
                  onDragEnd={(e) =>
                    updateIconPosition(icon.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    })
                  }
                >
                  <KonvaImage
                    image={icon.image}
                    x={0}
                    y={0}
                    width={icon.width}
                    height={icon.height}
                  />

                  {selectedIconId === icon.id && !isPreview && (
                    <Rect
                      x={-2}
                      y={-2}
                      width={icon.width + 4}
                      height={icon.height + 4}
                      stroke={selectionStroke}
                      strokeWidth={1}
                      dash={[6, 4]}
                      listening={false}
                    />
                  )}
                </Group>
              </Fragment>
            ))}

            {plan && legendItems.length > 0 && (
              <Group listening={false}>
                {(() => {
                  const isRtl = dirForLanguage(language) === "rtl";
                  const padding = 10;
                  const rowHeight = 20;
                  const iconSize = 16;
                  const gap = 8;
                  const margin = 12;

                  const labels = legendItems.map((item) => `${item.name} ×${item.count}`);
                  const approxTextWidth =
                    labels.reduce((max, label) => Math.max(max, label.length), 0) * 7;

                  const boxWidth = Math.min(
                    Math.ceil(padding * 2 + iconSize + gap + approxTextWidth),
                    Math.max(140, plan.width - margin * 2)
                  );
                  const boxHeight = padding * 2 + legendItems.length * rowHeight;

                  const x = Math.max(margin, plan.width - boxWidth - margin);
                  const y = Math.max(margin, plan.height - boxHeight - margin);

                  return (
                    <Group x={x} y={y}>
                      <Rect
                        x={0}
                        y={0}
                        width={boxWidth}
                        height={boxHeight}
                        fill={hexToRgba(backgroundColor, 0.88)}
                        stroke={hexToRgba(foregroundColor, 0.18)}
                        cornerRadius={10}
                        strokeWidth={1}
                      />

                      {legendItems.map((item, index) => {
                        const rowY = padding + index * rowHeight;
                        const iconY = rowY + Math.floor((rowHeight - iconSize) / 2);
                        const iconX = isRtl ? boxWidth - padding - iconSize : padding;
                        const textX = isRtl ? padding : padding + iconSize + gap;
                        const textWidth = boxWidth - padding * 2 - iconSize - gap;

                        return (
                          <Fragment key={item.key}>
                            <KonvaImage
                              image={item.image}
                              x={iconX}
                              y={iconY}
                              width={iconSize}
                              height={iconSize}
                            />
                            <Text
                              x={textX}
                              y={rowY + 3}
                              width={textWidth}
                              text={`${item.name} ×${item.count}`}
                              fontSize={12}
                              fill={foregroundColor}
                              align={isRtl ? "right" : "left"}
                            />
                          </Fragment>
                        );
                      })}
                    </Group>
                  );
                })()}
              </Group>
            )}
          </Layer>
        </Stage>
      )}

      {plan && !isPreview && (
        <div
          className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-zinc-200/70 bg-background/90 px-2 py-1 text-xs text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:text-zinc-300"
          dir={dirForLanguage(language)}
          lang={language}
        >
          {t(language, "canvas.hint")}
        </div>
      )}
    </div>
  );
}
