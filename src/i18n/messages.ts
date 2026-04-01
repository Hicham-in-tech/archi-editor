export const SUPPORTED_LANGUAGES = ["en", "fr", "ar"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type ThemeMode = "dark" | "light";

export function dirForLanguage(language: Language): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}

const messages = {
  "app.title": {
    en: "Architectural Plan Editor",
    fr: "Éditeur de plan architectural",
    ar: "محرر المخطط المعماري",
  },
  "app.subtitle.loading": {
    en: "Loading…",
    fr: "Chargement…",
    ar: "جاري التحميل…",
  },
  "app.subtitle.noPlan": {
    en: "No plan loaded",
    fr: "Aucun plan",
    ar: "لا يوجد مخطط",
  },

  "toolbar.selected": {
    en: "Selected: {name}",
    fr: "Sélectionné : {name}",
    ar: "المحدد: {name}",
  },
  "toolbar.fit": { en: "Fit", fr: "Ajuster", ar: "ملاءمة" },
  "toolbar.fitTitle": {
    en: "Fit plan to view",
    fr: "Ajuster le plan à l’écran",
    ar: "ملاءمة المخطط داخل الشاشة",
  },
  "toolbar.zoomOutTitle": { en: "Zoom out", fr: "Zoom arrière", ar: "تصغير" },
  "toolbar.zoomInTitle": { en: "Zoom in", fr: "Zoom avant", ar: "تكبير" },

  "toolbar.iconSmaller": { en: "Icon −", fr: "Icône −", ar: "أيقونة −" },
  "toolbar.iconSmallerTitle": {
    en: "Make selected icon smaller",
    fr: "Réduire l’icône sélectionnée",
    ar: "تصغير الأيقونة المحددة",
  },
  "toolbar.iconBigger": { en: "Icon +", fr: "Icône +", ar: "أيقونة +" },
  "toolbar.iconBiggerTitle": {
    en: "Make selected icon bigger",
    fr: "Agrandir l’icône sélectionnée",
    ar: "تكبير الأيقونة المحددة",
  },

  "toolbar.delete": { en: "Delete", fr: "Supprimer", ar: "حذف" },
  "toolbar.deleteTitle": {
    en: "Delete selected icon",
    fr: "Supprimer l’icône sélectionnée",
    ar: "حذف الأيقونة المحددة",
  },

  "toolbar.legendOn": {
    en: "Legend: On",
    fr: "Légende : Activée",
    ar: "الفهرس: مفعّل",
  },
  "toolbar.legendOff": {
    en: "Legend: Off",
    fr: "Légende : Désactivée",
    ar: "الفهرس: معطّل",
  },
  "toolbar.legendTitle": {
    en: "Show/hide legend on plan",
    fr: "Afficher/masquer la légende sur le plan",
    ar: "إظهار/إخفاء الفهرس على المخطط",
  },

  "toolbar.exportPngFailed": {
    en: "Export failed. Try again.",
    fr: "Échec de l’export. Réessayez.",
    ar: "فشل التصدير. حاول مرة أخرى.",
  },
  "toolbar.exportPdfFailed": {
    en: "PDF export failed. Try again.",
    fr: "Échec de l’export PDF. Réessayez.",
    ar: "فشل تصدير PDF. حاول مرة أخرى.",
  },
  "toolbar.exportPngTitle": {
    en: "Download final plan as PNG",
    fr: "Télécharger le plan final en PNG",
    ar: "تنزيل المخطط النهائي بصيغة PNG",
  },
  "toolbar.exportPdfTitle": {
    en: "Download final plan as PDF",
    fr: "Télécharger le plan final en PDF",
    ar: "تنزيل المخطط النهائي بصيغة PDF",
  },

  "toolbar.previewEnter": { en: "Preview", fr: "Aperçu", ar: "معاينة" },
  "toolbar.previewExit": {
    en: "Exit preview",
    fr: "Quitter l’aperçu",
    ar: "إنهاء المعاينة",
  },
  "toolbar.previewEnterTitle": {
    en: "Open preview",
    fr: "Ouvrir l’aperçu",
    ar: "فتح المعاينة",
  },
  "toolbar.previewExitTitle": {
    en: "Exit preview",
    fr: "Quitter l’aperçu",
    ar: "الخروج من المعاينة",
  },

  "toolbar.themeDark": {
    en: "Theme: Dark",
    fr: "Thème : Sombre",
    ar: "المظهر: داكن",
  },
  "toolbar.themeLight": {
    en: "Theme: Light",
    fr: "Thème : Clair",
    ar: "المظهر: فاتح",
  },
  "toolbar.themeTitle": {
    en: "Toggle light/dark theme",
    fr: "Basculer clair/sombre",
    ar: "تبديل المظهر الفاتح/الداكن",
  },
  "toolbar.languageTitle": { en: "Language", fr: "Langue", ar: "اللغة" },

  "plan.heading": { en: "Plan", fr: "Plan", ar: "المخطط" },
  "plan.description": {
    en: "Upload a plan/map image, then place icons on top.",
    fr: "Importez une image de plan/carte, puis placez des icônes par-dessus.",
    ar: "ارفع صورة مخطط/خريطة، ثم ضع الأيقونات فوقها.",
  },
  "plan.loadSample1": {
    en: "Load sample plan 1",
    fr: "Charger le plan d’exemple 1",
    ar: "تحميل المخطط التجريبي 1",
  },
  "plan.loadSample1Error": {
    en: "Couldn't load the sample plan. Try again.",
    fr: "Impossible de charger le plan d’exemple. Réessayez.",
    ar: "تعذّر تحميل المخطط التجريبي. حاول مرة أخرى.",
  },
  "plan.uploadLabel": {
    en: "Upload plan image",
    fr: "Importer l’image du plan",
    ar: "رفع صورة المخطط",
  },
  "plan.uploadError": {
    en: "Couldn't load the image. Try PNG/JPG/SVG.",
    fr: "Impossible de charger l’image. Essayez PNG/JPG/SVG.",
    ar: "تعذّر تحميل الصورة. جرّب PNG/JPG/SVG.",
  },
  "plan.remove": { en: "Remove plan", fr: "Retirer le plan", ar: "إزالة المخطط" },
  "plan.noneYet": {
    en: "No plan uploaded yet.",
    fr: "Aucun plan importé pour le moment.",
    ar: "لم يتم رفع أي مخطط بعد.",
  },

  "project.heading": { en: "Project", fr: "Projet", ar: "المشروع" },
  "project.nameLabel": {
    en: "Project name",
    fr: "Nom du projet",
    ar: "اسم المشروع",
  },
  "project.untitled": { en: "Untitled", fr: "Sans titre", ar: "بدون عنوان" },
  "project.save": { en: "Save", fr: "Enregistrer", ar: "حفظ" },
  "project.saving": {
    en: "Saving…",
    fr: "Enregistrement…",
    ar: "جاري الحفظ…",
  },
  "project.load": { en: "Load", fr: "Charger", ar: "تحميل" },
  "project.loading": {
    en: "Loading…",
    fr: "Chargement…",
    ar: "جاري التحميل…",
  },
  "project.saveError": {
    en: "Couldn't save this project.",
    fr: "Impossible d’enregistrer ce projet.",
    ar: "تعذّر حفظ هذا المشروع.",
  },
  "project.loadError": {
    en: "Couldn't load this project.",
    fr: "Impossible de charger ce projet.",
    ar: "تعذّر تحميل هذا المشروع.",
  },
  "project.noSaved": {
    en: "No saved projects",
    fr: "Aucun projet enregistré",
    ar: "لا توجد مشاريع محفوظة",
  },
  "project.selectTitleEmpty": {
    en: "No saved projects yet",
    fr: "Aucun projet enregistré pour le moment",
    ar: "لا توجد مشاريع محفوظة بعد",
  },
  "project.selectTitle": {
    en: "Choose a saved project",
    fr: "Choisir un projet enregistré",
    ar: "اختر مشروعًا محفوظًا",
  },
  "project.browserOnly": {
    en: "Projects are saved in this browser on this device.",
    fr: "Les projets sont enregistrés dans ce navigateur sur cet appareil.",
    ar: "يتم حفظ المشاريع في هذا المتصفح على هذا الجهاز.",
  },

  "icons.heading": { en: "Icons", fr: "Icônes", ar: "الأيقونات" },
  "icons.helperWithPlan": {
    en: "Click an icon to add it to the plan.",
    fr: "Cliquez sur une icône pour l’ajouter au plan.",
    ar: "انقر على أيقونة لإضافتها إلى المخطط.",
  },
  "icons.helperNoPlan": {
    en: "Upload a plan first to start placing icons.",
    fr: "Importez d’abord un plan pour placer des icônes.",
    ar: "ارفع مخططًا أولًا لبدء وضع الأيقونات.",
  },
  "icons.placed": {
    en: "Placed {count}",
    fr: "Placées {count}",
    ar: "تم وضع {count}",
  },
  "icons.uploadCustom": {
    en: "Upload custom icon",
    fr: "Importer une icône personnalisée",
    ar: "رفع أيقونة مخصصة",
  },
  "icons.iconUploadFailed": {
    en: "Couldn't load the icon file.",
    fr: "Impossible de charger le fichier d’icône.",
    ar: "تعذّر تحميل ملف الأيقونة.",
  },
  "icons.addFailed": {
    en: "Couldn't add the icon.",
    fr: "Impossible d’ajouter l’icône.",
    ar: "تعذّر إضافة الأيقونة.",
  },
  "icons.needPlanTitle": {
    en: "Upload a plan first",
    fr: "Importez d’abord un plan",
    ar: "ارفع مخططًا أولًا",
  },
  "icons.addTitle": {
    en: "Add {name}",
    fr: "Ajouter {name}",
    ar: "إضافة {name}",
  },

  "canvas.emptyTitle": {
    en: "Upload a plan to start",
    fr: "Importez un plan pour commencer",
    ar: "ارفع مخططًا للبدء",
  },
  "canvas.emptyText": {
    en: "Use the Plan panel to upload an image (or load sample plan 1), then add icons from the Icons panel.",
    fr: "Utilisez le panneau Plan pour importer une image (ou charger le plan d’exemple 1), puis ajoutez des icônes depuis le panneau Icônes.",
    ar: "استخدم لوحة المخطط لرفع صورة المخطط (أو تحميل المخطط التجريبي 1)، ثم أضف الأيقونات من لوحة الأيقونات.",
  },
  "canvas.hint": {
    en: "Mouse wheel to zoom · Drag empty space to pan · Click an icon to select",
    fr: "Molette pour zoomer · Glissez le fond pour déplacer · Cliquez une icône pour sélectionner",
    ar: "عجلة الفأرة للتكبير · اسحب الفراغ للتحريك · انقر على الأيقونة للتحديد",
  },

  "defaults.plan": { en: "Plan", fr: "Plan", ar: "مخطط" },
  "defaults.icon": { en: "Icon", fr: "Icône", ar: "أيقونة" },
  "sample.plan1Name": {
    en: "Sample plan 1",
    fr: "Plan d’exemple 1",
    ar: "مخطط تجريبي 1",
  },
} as const;

export type MessageKey = keyof typeof messages;

function formatTemplate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return match;
    return String(vars[key]);
  });
}

export function t(language: Language, key: MessageKey, vars?: Record<string, string | number>) {
  const entry = messages[key];
  const template = entry?.[language] ?? entry?.en;
  return formatTemplate(template ?? String(key), vars);
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};
