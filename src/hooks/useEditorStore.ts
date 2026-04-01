"use client";

import { create } from "zustand";
import { dirForLanguage, t, type Language, type ThemeMode } from "@/i18n/messages";
import { loadHtmlImage } from "@/utils/loadHtmlImage";

type StageSize = {
  width: number;
  height: number;
};

type Viewport = {
  scale: number;
  x: number;
  y: number;
};

export type PlanImage = {
  src: string;
  name: string;
  width: number;
  height: number;
  image: HTMLImageElement;
};

export type IconAsset = {
  id: string;
  name: string;
  src: string;
  kind: "builtin" | "custom";
};

export type PlacedIcon = {
  id: string;
  assetId: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
};

type SavedProjectSummary = {
  key: string;
  name: string;
  savedAt: number;
};

type SerializedProjectV1 = {
  version: 1;
  name: string;
  savedAt: number;
  plan: {
    src: string;
    name: string;
    width: number;
    height: number;
  } | null;
  icons: Array<{
    id: string;
    assetId: string;
    name: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  customAssets: Array<{
    id: string;
    name: string;
    src: string;
  }>;
  viewport: Viewport;
  showLegend: boolean;
};

type EditorState = {
  plan: PlanImage | null;
  isPlanLoading: boolean;

  projectName: string;
  savedProjects: SavedProjectSummary[];

  iconAssets: IconAsset[];
  assetImageCache: Record<string, HTMLImageElement>;

  icons: PlacedIcon[];
  selectedIconId: string | null;

  stageSize: StageSize | null;
  viewport: Viewport;
  isPreview: boolean;
  showLegend: boolean;

  language: Language;
  theme: ThemeMode;

  hydratePreferences: () => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  setStageSize: (size: StageSize) => void;

  setPlanFromFile: (file: File) => Promise<void>;
  loadSamplePlan1: () => Promise<void>;
  clearPlan: () => void;

  addCustomIconFromFile: (file: File) => Promise<void>;
  addIconToCanvas: (assetId: string) => Promise<void>;

  updateIconPosition: (iconId: string, pos: { x: number; y: number }) => void;
  scaleSelectedIcon: (scaleBy: number) => void;
  selectIcon: (iconId: string | null) => void;
  deleteSelectedIcon: () => void;
  deleteIcon: (iconId: string) => void;

  setViewport: (patch: Partial<Viewport>) => void;
  resetView: () => void;
  fitToPlan: () => void;
  zoomAtPoint: (point: { x: number; y: number }, scaleBy: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  toggleLegend: () => void;
  togglePreview: () => void;

  setProjectName: (name: string) => void;
  refreshSavedProjects: () => void;
  saveProjectToBrowser: () => Promise<void>;
  loadProjectFromBrowser: (key: string) => Promise<void>;

  exportPlanAsPng: () => Promise<void>;
  exportPlanAsPdf: () => Promise<void>;
};

const MIN_SCALE = 0.2;
const MAX_SCALE = 6;
const ICON_SIZE = 40;
const ICON_MIN_SIZE = 14;
const ICON_MAX_SIZE = 220;

const DEFAULT_LANGUAGE: Language = "en";
const DEFAULT_THEME: ThemeMode = "dark";

const STORAGE_INDEX_KEY = "archi-editor:saved-projects:index";
const STORAGE_PROJECT_PREFIX = "archi-editor:saved-project:";
const STORAGE_PREF_LANGUAGE = "archi-editor:pref:language";
const STORAGE_PREF_THEME = "archi-editor:pref:theme";

function isLanguage(value: string): value is Language {
  return value === "en" || value === "fr" || value === "ar";
}

function isThemeMode(value: string): value is ThemeMode {
  return value === "dark" || value === "light";
}

function applyLanguageToDocument(language: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = dirForLanguage(language);
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

function sanitizeBaseName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return base
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "plan";
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : "");
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return readBlobAsDataUrl(file);
}

async function ensurePersistableSrc(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;

  if (src.startsWith("blob:")) {
    const res = await fetch(src);
    const blob = await res.blob();
    return readBlobAsDataUrl(blob);
  }

  return src;
}

function getDefaultProjectName(plan: PlanImage | null, language: Language) {
  if (plan?.name) {
    const base = plan.name.replace(/\.[^/.]+$/, "").trim();
    return base || t(language, "project.untitled");
  }
  return t(language, "project.untitled");
}

function projectStorageKey(projectKey: string) {
  return `${STORAGE_PROJECT_PREFIX}${projectKey}`;
}

function isSavedProjectSummary(value: unknown): value is SavedProjectSummary {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    typeof record.name === "string" &&
    typeof record.savedAt === "number" &&
    Number.isFinite(record.savedAt)
  );
}

function readSavedProjectsIndex(): SavedProjectSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_INDEX_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isSavedProjectSummary);
  } catch {
    return [];
  }
}

function writeSavedProjectsIndex(items: SavedProjectSummary[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(items));
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
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

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  const background = styles.getPropertyValue("--background").trim() || "#ffffff";
  const foreground = styles.getPropertyValue("--foreground").trim() || "#171717";
  return { background, foreground };
}

function buildLegendItems(icons: PlacedIcon[], language: Language) {
  const map = new Map<
    string,
    {
      assetId: string;
      name: string;
      count: number;
      image: HTMLImageElement;
    }
  >();

  for (const icon of icons) {
    const existing = map.get(icon.assetId);
    if (existing) {
      existing.count += 1;
      continue;
    }
    map.set(icon.assetId, {
      assetId: icon.assetId,
      name: icon.name,
      count: 1,
      image: icon.image,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, language));
}

function drawLegendOnCanvas(params: {
  ctx: CanvasRenderingContext2D;
  planWidth: number;
  planHeight: number;
  legendItems: ReturnType<typeof buildLegendItems>;
  background: string;
  foreground: string;
  direction: "rtl" | "ltr";
}) {
  const { ctx, planWidth, planHeight, legendItems, background, foreground, direction } = params;
  if (legendItems.length === 0) return;

  const padding = 10;
  const rowHeight = 20;
  const iconSize = 16;
  const gap = 8;
  const margin = 12;

  ctx.save();
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

  const labels = legendItems.map((item) => `${item.name} ×${item.count}`);
  const maxTextWidth = labels.reduce((max, label) => {
    const w = ctx.measureText(label).width;
    return Math.max(max, w);
  }, 0);

  const boxWidth = Math.min(
    Math.ceil(padding * 2 + iconSize + gap + maxTextWidth),
    Math.max(140, planWidth - margin * 2)
  );
  const boxHeight = padding * 2 + legendItems.length * rowHeight;

  const x = Math.max(margin, planWidth - boxWidth - margin);
  const y = Math.max(margin, planHeight - boxHeight - margin);

  const radius = 10;
  ctx.fillStyle = hexToRgba(background, 0.88);
  ctx.strokeStyle = hexToRgba(foreground, 0.18);
  ctx.lineWidth = 1;

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + boxWidth - radius, y);
  ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
  ctx.lineTo(x + boxWidth, y + boxHeight - radius);
  ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
  ctx.lineTo(x + radius, y + boxHeight);
  ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = foreground;
  // Best-effort direction support.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx as any).direction = direction;
  } catch {
    // Ignore
  }
  ctx.textAlign = direction === "rtl" ? "right" : "left";
  for (let i = 0; i < legendItems.length; i += 1) {
    const item = legendItems[i];
    if (!item) continue;
    const rowY = y + padding + i * rowHeight;
    const iconY = rowY + Math.floor((rowHeight - iconSize) / 2);

    const iconX = direction === "rtl" ? x + boxWidth - padding - iconSize : x + padding;
    const textX = direction === "rtl" ? iconX - gap : iconX + iconSize + gap;
    const maxLabelWidth = boxWidth - padding * 2 - iconSize - gap;

    try {
      ctx.drawImage(item.image, iconX, iconY, iconSize, iconSize);
    } catch {
      // Ignore draw errors for rare cases (e.g. broken image)
    }

    const textY = rowY + 14;
    const label = `${item.name} ×${item.count}`;
    ctx.fillText(label, textX, textY, maxLabelWidth);
  }

  ctx.restore();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

type BuiltinIconDefinition = {
  id: string;
  src: string;
  labels: Record<Language, string>;
};

const builtinIconDefinitions: BuiltinIconDefinition[] = [
  {
    id: "builtin-first-aid-area",
    src: "/icons/first-aid-area.svg",
    labels: {
      en: "First aid area",
      fr: "Zone de premiers secours",
      ar: "منطقة الإسعافات الأولية",
    },
  },
  {
    id: "builtin-assembly-area",
    src: "/icons/assembly-area.svg",
    labels: {
      en: "Assembly area",
      fr: "Zone de rassemblement",
      ar: "منطقة التجمع",
    },
  },
  {
    id: "builtin-first-aid-kit",
    src: "/icons/first-aid-kit.svg",
    labels: {
      en: "First aid kit",
      fr: "Trousse de premiers secours",
      ar: "حقيبة الإسعافات الأولية",
    },
  },
  {
    id: "builtin-entrance",
    src: "/icons/entrance.svg",
    labels: {
      en: "Facility entrance",
      fr: "Entrée de l’établissement",
      ar: "مدخل المؤسسة",
    },
  },
  {
    id: "builtin-phone",
    src: "/icons/phone.svg",
    labels: {
      en: "Phone",
      fr: "Téléphone",
      ar: "الهاتف",
    },
  },
  {
    id: "builtin-fire-extinguisher",
    src: "/icons/fire-extinguisher.svg",
    labels: {
      en: "Fire extinguisher",
      fr: "Extincteur",
      ar: "مطفأة الحريق",
    },
  },
  {
    id: "builtin-electric-breaker",
    src: "/icons/electric-breaker.svg",
    labels: {
      en: "Electrical breaker",
      fr: "Disjoncteur électrique",
      ar: "قاطع التيار الكهربائي",
    },
  },
  {
    id: "builtin-water-shutoff",
    src: "/icons/water-shutoff.svg",
    labels: {
      en: "Water shutoff",
      fr: "Vanne d’arrêt d’eau",
      ar: "قاطع الماء",
    },
  },
  {
    id: "builtin-dorm-assembly",
    src: "/icons/dorm-assembly.svg",
    labels: {
      en: "Dorm assembly area",
      fr: "Zone de rassemblement (résidence)",
      ar: "منطقة تجمع طلبة الإقامة",
    },
  },
  {
    id: "builtin-drinking-water",
    src: "/icons/drinking-water.svg",
    labels: {
      en: "Drinking water point",
      fr: "Point d’eau potable",
      ar: "نقطة ماء للشرب",
    },
  },
];

function getBuiltinIconAssets(language: Language): IconAsset[] {
  return builtinIconDefinitions.map((def) => ({
    id: def.id,
    name: def.labels[language],
    src: def.src,
    kind: "builtin" as const,
  }));
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  plan: null,
  isPlanLoading: false,

  projectName: "",
  savedProjects: [],

  iconAssets: getBuiltinIconAssets(DEFAULT_LANGUAGE),
  assetImageCache: {},

  icons: [],
  selectedIconId: null,

  stageSize: null,
  viewport: { scale: 1, x: 0, y: 0 },
  isPreview: false,
  showLegend: true,

  language: DEFAULT_LANGUAGE,
  theme: DEFAULT_THEME,

  hydratePreferences: () => {
    if (typeof window === "undefined") return;

    let language: Language = DEFAULT_LANGUAGE;
    let theme: ThemeMode = DEFAULT_THEME;

    try {
      const raw = window.localStorage.getItem(STORAGE_PREF_LANGUAGE);
      if (raw && isLanguage(raw)) language = raw;
    } catch {
      // Ignore
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_PREF_THEME);
      if (raw && isThemeMode(raw)) theme = raw;
    } catch {
      // Ignore
    }

    applyLanguageToDocument(language);
    applyThemeToDocument(theme);

    set((state) => {
      const customAssets = state.iconAssets.filter((a) => a.kind === "custom");
      const iconAssets = [...getBuiltinIconAssets(language), ...customAssets];
      const metaById = new Map(iconAssets.map((a) => [a.id, { name: a.name, kind: a.kind }] as const));
      const icons = state.icons.map((icon) => {
        const meta = metaById.get(icon.assetId);
        if (!meta || meta.kind !== "builtin") return icon;
        if (icon.name === meta.name) return icon;
        return { ...icon, name: meta.name };
      });

      return { language, theme, iconAssets, icons };
    });
  },

  setLanguage: (language) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_PREF_LANGUAGE, language);
      } catch {
        // Ignore
      }
    }

    applyLanguageToDocument(language);

    set((state) => {
      const customAssets = state.iconAssets.filter((a) => a.kind === "custom");
      const iconAssets = [...getBuiltinIconAssets(language), ...customAssets];
      const metaById = new Map(iconAssets.map((a) => [a.id, { name: a.name, kind: a.kind }] as const));
      const icons = state.icons.map((icon) => {
        const meta = metaById.get(icon.assetId);
        if (!meta || meta.kind !== "builtin") return icon;
        if (icon.name === meta.name) return icon;
        return { ...icon, name: meta.name };
      });

      return { language, iconAssets, icons };
    });
  },

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_PREF_THEME, theme);
      } catch {
        // Ignore
      }
    }

    applyThemeToDocument(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  setStageSize: (size) => set({ stageSize: size }),

  setPlanFromFile: async (file) => {
    if (typeof window === "undefined") return;

    const language = get().language;

    set({ isPlanLoading: true });

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadHtmlImage(dataUrl);
      const plan: PlanImage = {
        src: dataUrl,
        name: file.name,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        image,
      };

      set((state) => {
        if (state.plan?.src?.startsWith("blob:")) {
          URL.revokeObjectURL(state.plan.src);
        }

        return {
          plan,
          icons: [],
          selectedIconId: null,
          isPreview: false,
          showLegend: true,
          projectName:
            state.projectName.trim() ? state.projectName : getDefaultProjectName(plan, language),
        };
      });

      // If stage size is already known, this will snap the image nicely.
      get().fitToPlan();
    } finally {
      set({ isPlanLoading: false });
    }
  },

  loadSamplePlan1: async () => {
    if (typeof window === "undefined") return;

    const language = get().language;

    set({ isPlanLoading: true });

    try {
      const src = "/plane1.jpeg";
      const image = await loadHtmlImage(src);

      const plan: PlanImage = {
        src,
        name: t(language, "sample.plan1Name"),
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        image,
      };

      set((state) => {
        if (state.plan?.src?.startsWith("blob:")) {
          URL.revokeObjectURL(state.plan.src);
        }

        return {
          plan,
          icons: [],
          selectedIconId: null,
          isPreview: false,
          showLegend: true,
          projectName:
            state.projectName.trim() ? state.projectName : getDefaultProjectName(plan, language),
        };
      });

      get().fitToPlan();
    } finally {
      set({ isPlanLoading: false });
    }
  },

  clearPlan: () =>
    set((state) => {
      if (state.plan?.src?.startsWith("blob:")) {
        URL.revokeObjectURL(state.plan.src);
      }

      return {
        plan: null,
        icons: [],
        selectedIconId: null,
        viewport: { scale: 1, x: 0, y: 0 },
        isPreview: false,
        showLegend: true,
      };
    }),

  addCustomIconFromFile: async (file) => {
    if (typeof window === "undefined") return;

    const dataUrl = await readFileAsDataUrl(file);

    // Validate that it can actually load before adding it.
    await loadHtmlImage(dataUrl);

    const asset: IconAsset = {
      id: createId("custom"),
      name: file.name.replace(/\.[^/.]+$/, ""),
      src: dataUrl,
      kind: "custom",
    };

    set((state) => ({ iconAssets: [...state.iconAssets, asset] }));
  },

  addIconToCanvas: async (assetId) => {
    const state = get();
    if (!state.plan) return;

    const asset = state.iconAssets.find((a) => a.id === assetId);
    if (!asset) return;

    const stageSize = state.stageSize;
    const viewport = state.viewport;
    const screenPoint = stageSize
      ? { x: stageSize.width / 2, y: stageSize.height / 2 }
      : { x: 100, y: 100 };

    const worldPoint = {
      x: (screenPoint.x - viewport.x) / viewport.scale,
      y: (screenPoint.y - viewport.y) / viewport.scale,
    };

    const x = worldPoint.x - ICON_SIZE / 2;
    const y = worldPoint.y - ICON_SIZE / 2;

    let image = state.assetImageCache[assetId];
    if (!image) {
      image = await loadHtmlImage(asset.src);
      set((s) => ({ assetImageCache: { ...s.assetImageCache, [assetId]: image } }));
    }

    const placed: PlacedIcon = {
      id: createId("icon"),
      assetId,
      name: asset.name,
      src: asset.src,
      x,
      y,
      width: ICON_SIZE,
      height: ICON_SIZE,
      image,
    };

    set((s) => ({
      icons: [...s.icons, placed],
      selectedIconId: placed.id,
    }));
  },

  updateIconPosition: (iconId, pos) =>
    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === iconId ? { ...icon, x: pos.x, y: pos.y } : icon
      ),
    })),

  scaleSelectedIcon: (scaleBy) =>
    set((state) => {
      const selectedId = state.selectedIconId;
      if (!selectedId) return {};

      return {
        icons: state.icons.map((icon) => {
          if (icon.id !== selectedId) return icon;

          const nextWidth = clamp(icon.width * scaleBy, ICON_MIN_SIZE, ICON_MAX_SIZE);
          const nextHeight = clamp(icon.height * scaleBy, ICON_MIN_SIZE, ICON_MAX_SIZE);

          const centerX = icon.x + icon.width / 2;
          const centerY = icon.y + icon.height / 2;

          return {
            ...icon,
            width: nextWidth,
            height: nextHeight,
            x: centerX - nextWidth / 2,
            y: centerY - nextHeight / 2,
          };
        }),
      };
    }),

  selectIcon: (iconId) => set({ selectedIconId: iconId }),

  deleteSelectedIcon: () => {
    const selectedIconId = get().selectedIconId;
    if (!selectedIconId) return;
    get().deleteIcon(selectedIconId);
  },

  deleteIcon: (iconId) =>
    set((state) => ({
      icons: state.icons.filter((icon) => icon.id !== iconId),
      selectedIconId: state.selectedIconId === iconId ? null : state.selectedIconId,
    })),

  setViewport: (patch) =>
    set((state) => ({ viewport: { ...state.viewport, ...patch } })),

  resetView: () => set({ viewport: { scale: 1, x: 0, y: 0 } }),

  fitToPlan: () => {
    const { plan, stageSize } = get();
    if (!plan || !stageSize) return;

    const padding = 24;
    const availableWidth = Math.max(stageSize.width - padding * 2, 1);
    const availableHeight = Math.max(stageSize.height - padding * 2, 1);

    const rawScale = Math.min(availableWidth / plan.width, availableHeight / plan.height);
    const scale = clamp(rawScale, MIN_SCALE, MAX_SCALE);

    const x = (stageSize.width - plan.width * scale) / 2;
    const y = (stageSize.height - plan.height * scale) / 2;

    set({ viewport: { scale, x, y } });
  },

  zoomAtPoint: (point, scaleBy) => {
    const { viewport } = get();

    const oldScale = viewport.scale;
    const newScale = clamp(oldScale * scaleBy, MIN_SCALE, MAX_SCALE);
    if (newScale === oldScale) return;

    const mousePointTo = {
      x: (point.x - viewport.x) / oldScale,
      y: (point.y - viewport.y) / oldScale,
    };

    const newPos = {
      x: point.x - mousePointTo.x * newScale,
      y: point.y - mousePointTo.y * newScale,
    };

    set({ viewport: { scale: newScale, x: newPos.x, y: newPos.y } });
  },

  zoomIn: () => {
    const { stageSize } = get();
    if (!stageSize) return;
    get().zoomAtPoint({ x: stageSize.width / 2, y: stageSize.height / 2 }, 1.1);
  },

  zoomOut: () => {
    const { stageSize } = get();
    if (!stageSize) return;
    get().zoomAtPoint({ x: stageSize.width / 2, y: stageSize.height / 2 }, 1 / 1.1);
  },

  toggleLegend: () => set((state) => ({ showLegend: !state.showLegend })),

  togglePreview: () =>
    set((state) => ({
      isPreview: !state.isPreview,
      selectedIconId: null,
    })),

  setProjectName: (name) => set({ projectName: name }),

  refreshSavedProjects: () => {
    if (typeof window === "undefined") return;
    set({ savedProjects: readSavedProjectsIndex() });
  },

  saveProjectToBrowser: async () => {
    if (typeof window === "undefined") return;

    const state = get();
    if (!state.plan) {
      throw new Error("No plan to save");
    }

    const name =
      state.projectName.trim() || getDefaultProjectName(state.plan, state.language);
    const key = encodeURIComponent(name);
    const savedAt = Date.now();

    const plan = state.plan
      ? {
          src: await ensurePersistableSrc(state.plan.src),
          name: state.plan.name,
          width: state.plan.width,
          height: state.plan.height,
        }
      : null;

    const customAssets = await Promise.all(
      state.iconAssets
        .filter((asset) => asset.kind === "custom")
        .map(async (asset) => ({
          id: asset.id,
          name: asset.name,
          src: await ensurePersistableSrc(asset.src),
        }))
    );

    const icons = await Promise.all(
      state.icons.map(async (icon) => ({
        id: icon.id,
        assetId: icon.assetId,
        name: icon.name,
        src: await ensurePersistableSrc(icon.src),
        x: icon.x,
        y: icon.y,
        width: icon.width,
        height: icon.height,
      }))
    );

    const project: SerializedProjectV1 = {
      version: 1,
      name,
      savedAt,
      plan,
      icons,
      customAssets,
      viewport: state.viewport,
      showLegend: state.showLegend,
    };

    window.localStorage.setItem(projectStorageKey(key), JSON.stringify(project));

    const nextIndex = [
      { key, name, savedAt },
      ...readSavedProjectsIndex().filter((item) => item.key !== key),
    ].slice(0, 50);

    writeSavedProjectsIndex(nextIndex);
    set({ projectName: name, savedProjects: nextIndex });
  },

  loadProjectFromBrowser: async (key) => {
    if (typeof window === "undefined") return;

    const language = get().language;

    const raw = window.localStorage.getItem(projectStorageKey(key));
    if (!raw) throw new Error("Saved project not found");

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid project data");

    const project = parsed as Partial<SerializedProjectV1>;
    if (project.version !== 1) throw new Error("Unsupported project version");

    let nextPlan: PlanImage | null = null;
    if (project.plan && typeof project.plan === "object") {
      const src = await ensurePersistableSrc(project.plan.src ?? "");
      if (src) {
        const image = await loadHtmlImage(src);
        nextPlan = {
          src,
          name: project.plan.name ?? t(language, "defaults.plan"),
          width: project.plan.width || image.naturalWidth || image.width,
          height: project.plan.height || image.naturalHeight || image.height,
          image,
        };
      }
    }

    const customAssets: IconAsset[] = Array.isArray(project.customAssets)
      ? project.customAssets
          .filter((asset) => asset && typeof asset === "object")
          .map((asset) => asset as { id: string; name: string; src: string })
          .filter(
            (asset) =>
              typeof asset.id === "string" &&
              typeof asset.name === "string" &&
              typeof asset.src === "string"
          )
          .map((asset) => ({
            id: asset.id,
            name: asset.name,
            src: asset.src,
            kind: "custom" as const,
          }))
      : [];

    const seenAssetIds = new Set<string>();
    const nextIconAssets: IconAsset[] = [];
    const localizedBuiltins = getBuiltinIconAssets(language);
    for (const asset of [...localizedBuiltins, ...customAssets]) {
      if (seenAssetIds.has(asset.id)) continue;
      seenAssetIds.add(asset.id);
      nextIconAssets.push(asset);
    }

    const assetSrcById = new Map(nextIconAssets.map((asset) => [asset.id, asset.src] as const));
    const assetNameById = new Map(nextIconAssets.map((asset) => [asset.id, asset.name] as const));
    const assetKindById = new Map(nextIconAssets.map((asset) => [asset.id, asset.kind] as const));

    const nextAssetImageCache: Record<string, HTMLImageElement> = {};
    const nextIcons: PlacedIcon[] = [];

    const rawIcons = Array.isArray(project.icons) ? project.icons : [];
    for (const rawIcon of rawIcons) {
      if (!rawIcon || typeof rawIcon !== "object") continue;
      const icon = rawIcon as {
        id?: string;
        assetId?: string;
        name?: string;
        src?: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      };

      const assetId = typeof icon.assetId === "string" ? icon.assetId : "";
      if (!assetId) continue;

      const src = await ensurePersistableSrc(
        typeof icon.src === "string" && icon.src
          ? icon.src
          : assetSrcById.get(assetId) ?? ""
      );
      if (!src) continue;

      let image = nextAssetImageCache[assetId];
      if (!image) {
        image = await loadHtmlImage(src);
        nextAssetImageCache[assetId] = image;
      }

      nextIcons.push({
        id: typeof icon.id === "string" && icon.id ? icon.id : createId("icon"),
        assetId,
        name: (() => {
          const fallbackName = assetNameById.get(assetId) ?? t(language, "defaults.icon");
          const kind = assetKindById.get(assetId);
          if (kind === "custom") {
            return typeof icon.name === "string" && icon.name ? icon.name : fallbackName;
          }
          return fallbackName;
        })(),
        src,
        x: typeof icon.x === "number" && Number.isFinite(icon.x) ? icon.x : 0,
        y: typeof icon.y === "number" && Number.isFinite(icon.y) ? icon.y : 0,
        width:
          typeof icon.width === "number" && Number.isFinite(icon.width)
            ? icon.width
            : ICON_SIZE,
        height:
          typeof icon.height === "number" && Number.isFinite(icon.height)
            ? icon.height
            : ICON_SIZE,
        image,
      });
    }

    const nextViewport = project.viewport
      ? {
          scale:
            typeof project.viewport.scale === "number"
              ? clamp(project.viewport.scale, MIN_SCALE, MAX_SCALE)
              : 1,
          x: typeof project.viewport.x === "number" ? project.viewport.x : 0,
          y: typeof project.viewport.y === "number" ? project.viewport.y : 0,
        }
      : { scale: 1, x: 0, y: 0 };

    set((state) => {
      if (state.plan?.src?.startsWith("blob:")) {
        URL.revokeObjectURL(state.plan.src);
      }
      for (const asset of state.iconAssets) {
        if (asset.kind === "custom" && asset.src.startsWith("blob:")) {
          URL.revokeObjectURL(asset.src);
        }
      }

      return {
        plan: nextPlan,
        isPlanLoading: false,
        iconAssets: nextIconAssets,
        assetImageCache: nextAssetImageCache,
        icons: nextIcons,
        selectedIconId: null,
        viewport: nextViewport,
        isPreview: false,
        showLegend: typeof project.showLegend === "boolean" ? project.showLegend : true,
        projectName: typeof project.name === "string" ? project.name : state.projectName,
      };
    });

    // Keep the saved-projects list in sync.
    get().refreshSavedProjects();
  },

  exportPlanAsPng: async () => {
    if (typeof window === "undefined") return;

    const { plan, icons, showLegend, language } = get();
    if (!plan) return;

    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context is not available");

    const { background, foreground } = getThemeColors();
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, plan.width, plan.height);
    ctx.drawImage(plan.image, 0, 0, plan.width, plan.height);

    for (const icon of icons) {
      ctx.drawImage(icon.image, icon.x, icon.y, icon.width, icon.height);
    }

    if (showLegend) {
      const legendItems = buildLegendItems(icons, language);
      drawLegendOnCanvas({
        ctx,
        planWidth: plan.width,
        planHeight: plan.height,
        legendItems,
        background,
        foreground,
        direction: dirForLanguage(language),
      });
    }

    const exportName = get().projectName.trim() || plan.name;
    const baseName = sanitizeBaseName(exportName);
    const dataUrl = canvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, `${baseName}.png`);
  },

  exportPlanAsPdf: async () => {
    if (typeof window === "undefined") return;

    const { plan, language } = get();
    if (!plan) return;

    // Reuse the PNG rendering for consistent output.
    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context is not available");

    const { icons, showLegend } = get();
    const { background, foreground } = getThemeColors();
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, plan.width, plan.height);
    ctx.drawImage(plan.image, 0, 0, plan.width, plan.height);
    for (const icon of icons) {
      ctx.drawImage(icon.image, icon.x, icon.y, icon.width, icon.height);
    }

    if (showLegend) {
      const legendItems = buildLegendItems(icons, language);
      drawLegendOnCanvas({
        ctx,
        planWidth: plan.width,
        planHeight: plan.height,
        legendItems,
        background,
        foreground,
        direction: dirForLanguage(language),
      });
    }

    const pngDataUrl = canvas.toDataURL("image/png");

    const { jsPDF } = await import("jspdf");
    const orientation = plan.width >= plan.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "px",
      format: [plan.width, plan.height],
      compress: true,
      hotfixes: ["px_scaling"],
    });

    pdf.addImage(pngDataUrl, "PNG", 0, 0, plan.width, plan.height);
    const exportName = get().projectName.trim() || plan.name;
    const baseName = sanitizeBaseName(exportName);
    pdf.save(`${baseName}.pdf`);
  },
}));
