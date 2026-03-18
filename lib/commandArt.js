const Jimp = require("jimp");

const cache = new Map();
const fontCache = new Map();

const THEMES = {
  dbz: {
    accent: 0xff9f1cff,
    accentSoft: 0xffd166ff,
    secondary: 0x1f2a44ff,
    overlay: 0x0b1020ff,
    text: 0xf8fafcff,
    eyebrow: "Dragon Ball Z",
    badge: "Ki desbloqueado",
  },
  descargas: {
    accent: 0x00c2ffff,
    accentSoft: 0x35f3a1ff,
    secondary: 0x182848ff,
    overlay: 0x060b16ff,
    text: 0xf5fbffff,
    eyebrow: "Centro de energia",
    badge: "Descarga lista",
  },
  owner: {
    accent: 0xff7b00ff,
    accentSoft: 0xffc857ff,
    secondary: 0x2d1b69ff,
    overlay: 0x0d0a17ff,
    text: 0xfaf5ffff,
    eyebrow: "Control del owner",
    badge: "Acceso maestro",
  },
  informacion: {
    accent: 0x00d1b2ff,
    accentSoft: 0x5ce1e6ff,
    secondary: 0x12355bff,
    overlay: 0x071320ff,
    text: 0xf4ffffff,
    eyebrow: "Lectura del sistema",
    badge: "Estado de combate",
  },
  ia: {
    accent: 0x6ee7ffff,
    accentSoft: 0x00ffa6ff,
    secondary: 0x1d3557ff,
    overlay: 0x08121eff,
    text: 0xf1f5f9ff,
    eyebrow: "Mente artificial",
    badge: "Analisis activo",
  },
  busqueda: {
    accent: 0x48cae4ff,
    accentSoft: 0x90e0efff,
    secondary: 0x14213dff,
    overlay: 0x08111eff,
    text: 0xf8fbffff,
    eyebrow: "Radar del bot",
    badge: "Busqueda abierta",
  },
  groups: {
    accent: 0x80ed99ff,
    accentSoft: 0x57cc99ff,
    secondary: 0x22577aff,
    overlay: 0x07141bff,
    text: 0xf6fff8ff,
    eyebrow: "Campo de batalla",
    badge: "Grupo protegido",
  },
  servicios: {
    accent: 0xff6b6bff,
    accentSoft: 0xffa94dff,
    secondary: 0x3a0ca3ff,
    overlay: 0x0d0917ff,
    text: 0xfff8f0ff,
    eyebrow: "Servicios premium",
    badge: "Modo hosting",
  },
  diversion: {
    accent: 0xff4d6dff,
    accentSoft: 0xff8fabff,
    secondary: 0x240046ff,
    overlay: 0x0f0618ff,
    text: 0xfff1f2ff,
    eyebrow: "Modo diversion",
    badge: "Energia en juego",
  },
  random: {
    accent: 0xff5d8fff,
    accentSoft: 0xffc6ffff,
    secondary: 0x3c096cff,
    overlay: 0x0e0717ff,
    text: 0xfff7ffff,
    eyebrow: "Aura aleatoria",
    badge: "Estilo SonGoku",
  },
  default: {
    accent: 0xff8c42ff,
    accentSoft: 0xffd166ff,
    secondary: 0x1d3557ff,
    overlay: 0x09111eff,
    text: 0xf8fafcff,
    eyebrow: "SonGokuBot",
    badge: "Ultra Instinto",
  },
};

const SHORT_REPLY_LIMIT = 18;
const TEXT_ONLY_KEYS = [
  "text",
  "caption",
];
const MEDIA_KEYS = [
  "image",
  "video",
  "audio",
  "sticker",
  "document",
  "buttons",
  "templateButtons",
  "sections",
  "location",
  "contacts",
  "poll",
  "react",
  "listMessage",
];

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickTheme(category) {
  return THEMES[normalizeKey(category)] || THEMES.default;
}

function hexToRgb(color) {
  return {
    r: (color >>> 24) & 255,
    g: (color >>> 16) & 255,
    b: (color >>> 8) & 255,
    a: color & 255,
  };
}

function rgbToInt({ r, g, b, a = 255 }) {
  return Jimp.rgbaToInt(r, g, b, a);
}

function mixColors(colorA, colorB, amount) {
  const left = hexToRgb(colorA);
  const right = hexToRgb(colorB);
  return rgbToInt({
    r: Math.round(left.r + (right.r - left.r) * amount),
    g: Math.round(left.g + (right.g - left.g) * amount),
    b: Math.round(left.b + (right.b - left.b) * amount),
    a: Math.round(left.a + (right.a - left.a) * amount),
  });
}

async function loadFont(name) {
  if (!fontCache.has(name)) {
    fontCache.set(name, await Jimp.loadFont(name));
  }
  return fontCache.get(name);
}

function fillVerticalGradient(image, topColor, bottomColor) {
  const { width, height } = image.bitmap;
  for (let y = 0; y < height; y += 1) {
    const tone = mixColors(topColor, bottomColor, y / Math.max(1, height - 1));
    for (let x = 0; x < width; x += 1) {
      image.setPixelColor(tone, x, y);
    }
  }
}

function fillRect(image, x, y, width, height, color) {
  for (let offsetY = 0; offsetY < height; offsetY += 1) {
    for (let offsetX = 0; offsetX < width; offsetX += 1) {
      image.setPixelColor(color, x + offsetX, y + offsetY);
    }
  }
}

function drawCircle(image, centerX, centerY, radius, color, alpha = 0.18) {
  const tint = mixColors(0x00000000, color, alpha);
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) {
        const pixelX = centerX + x;
        const pixelY = centerY + y;
        if (
          pixelX >= 0 &&
          pixelX < image.bitmap.width &&
          pixelY >= 0 &&
          pixelY < image.bitmap.height
        ) {
          image.setPixelColor(tint, pixelX, pixelY);
        }
      }
    }
  }
}

function drawAccentLines(image, theme) {
  const topLine = mixColors(theme.accent, 0xffffffff, 0.18);
  const bottomLine = mixColors(theme.accentSoft, theme.secondary, 0.35);

  fillRect(image, 0, 0, image.bitmap.width, 14, topLine);
  fillRect(image, 0, image.bitmap.height - 16, image.bitmap.width, 16, bottomLine);
  fillRect(image, 56, 84, 150, 8, theme.accentSoft);
  fillRect(image, image.bitmap.width - 280, 128, 180, 8, theme.accent);
}

function drawDragonBalls(image, theme) {
  const size = 40;
  const baseX = image.bitmap.width - 390;
  const baseY = image.bitmap.height - 100;
  const ballColor = mixColors(theme.accent, 0xfff1b0ff, 0.5);

  for (let index = 0; index < 7; index += 1) {
    const centerX = baseX + index * 48;
    const centerY = baseY + (index % 2 === 0 ? 0 : -18);
    drawCircle(image, centerX, centerY, size / 2, ballColor, 0.82);
    fillRect(image, centerX - 2, centerY - 2, 4, 4, 0xb92d00ff);
  }
}

function summarizeText(text) {
  const plain = String(text || "").replace(/\s+/g, " ").trim();
  if (!plain) return "Energia lista para responder";
  if (plain.length <= 88) return plain;
  return `${plain.slice(0, 85).trim()}...`;
}

function shouldIgnoreText(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.length < SHORT_REPLY_LIMIT) return true;
  if (/^(🏓|⏳|⌛|⚙️|♻️|✅|❌|→)\s*(ping|espera|reiniciando|iniciando|procesando|intentando)/i.test(normalized)) {
    return true;
  }
  if (/^(aun|aún)\s+estas\s+entrenando/i.test(normalized)) {
    return true;
  }
  return false;
}

function shouldDecorateText({ text, meta = {}, options = {} }) {
  if (options.disableCommandArt) return false;
  if (normalizeKey(meta.command) === "menu") return false;
  if (normalizeKey(meta.category) === "menu") return false;
  return !shouldIgnoreText(text);
}

async function createArtBuffer({ command, category, subtitle }) {
  const normalizedCommand = normalizeKey(command) || "comando";
  const normalizedCategory = normalizeKey(category) || "default";
  const cacheKey = `${normalizedCategory}:${normalizedCommand}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const theme = pickTheme(category);
  const image = new Jimp(1280, 720, theme.overlay);
  fillVerticalGradient(image, mixColors(theme.secondary, theme.overlay, 0.18), theme.overlay);
  drawAccentLines(image, theme);
  drawCircle(image, 1015, 175, 180, theme.accent, 0.24);
  drawCircle(image, 1130, 280, 120, theme.accentSoft, 0.22);
  drawCircle(image, 160, 590, 145, theme.secondary, 0.3);
  drawDragonBalls(image, theme);

  fillRect(image, 58, 118, 430, 420, mixColors(theme.overlay, theme.secondary, 0.28));
  fillRect(image, 74, 136, 16, 382, theme.accent);
  fillRect(image, 98, 500, 320, 6, theme.accentSoft);
  fillRect(image, 458, 136, 4, 352, mixColors(theme.accentSoft, theme.secondary, 0.38));

  const font64 = await loadFont(Jimp.FONT_SANS_64_WHITE);
  const font32 = await loadFont(Jimp.FONT_SANS_32_WHITE);
  const font16 = await loadFont(Jimp.FONT_SANS_16_WHITE);

  const commandTitle = titleCase(command || "Comando");
  const categoryTitle = titleCase(category || "General");

  image.print(font16, 104, 150, {
    text: theme.eyebrow.toUpperCase(),
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  }, 520, 30);

  image.print(font64, 100, 190, {
    text: commandTitle.toUpperCase(),
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 620, 120);

  image.print(font32, 102, 320, {
    text: `Categoria ${categoryTitle}`,
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 560, 60);

  image.print(font16, 102, 382, {
    text: summarizeText(subtitle),
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 500, 100);

  image.print(font16, 102, 470, {
    text: theme.badge,
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 260, 24);

  image.print(font16, 744, 112, {
    text: "SONGOKUBOT",
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 200, 24);

  image.print(font32, 740, 150, {
    text: categoryTitle.toUpperCase(),
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 360, 46);

  image.print(font16, 740, 210, {
    text: "Aura visual generada automaticamente para este comando.",
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP,
  }, 360, 70);

  image.print(font16, 744, 610, {
    text: "DVYER x SonGokuBot",
    alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
    alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM,
  }, 430, 40);

  const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
  cache.set(cacheKey, buffer);
  return buffer;
}

function stripUtilityOptions(options = {}) {
  const clean = { ...options };
  delete clean.disableCommandArt;
  delete clean.commandArtTitle;
  delete clean.commandArtSubtitle;
  return clean;
}

async function decorateReplyPayload({ text, options = {}, meta = {} }) {
  if (!shouldDecorateText({ text, meta, options })) {
    return {
      content: { ...stripUtilityOptions(options), text },
      options: stripUtilityOptions(options),
      decorated: false,
    };
  }

  const subtitle = options.commandArtSubtitle || text;
  const imageBuffer = await createArtBuffer({
    command: options.commandArtTitle || meta.command,
    category: meta.category,
    subtitle,
  });

  const cleanOptions = stripUtilityOptions(options);
  const content = {
    ...cleanOptions,
    image: imageBuffer,
    caption: text,
  };

  return {
    content,
    options: cleanOptions,
    decorated: true,
  };
}

function isTextOnlyContent(content) {
  if (!content || typeof content !== "object") return false;
  if (!Object.keys(content).some((key) => TEXT_ONLY_KEYS.includes(key))) return false;
  if (Object.keys(content).some((key) => MEDIA_KEYS.includes(key))) return false;
  return typeof content.text === "string" && !content.caption;
}

async function decorateSendMessagePayload({ content = {}, options = {}, meta = {} }) {
  if (!isTextOnlyContent(content)) {
    return { content, options, decorated: false };
  }

  const baseContent = { ...content };
  const text = baseContent.text;
  delete baseContent.text;

  if (!shouldDecorateText({ text, meta, options: baseContent })) {
    return { content, options, decorated: false };
  }

  const subtitle = baseContent.commandArtSubtitle || text;
  const imageBuffer = await createArtBuffer({
    command: baseContent.commandArtTitle || meta.command,
    category: meta.category,
    subtitle,
  });

  const cleanContent = stripUtilityOptions(baseContent);
  return {
    content: {
      ...cleanContent,
      image: imageBuffer,
      caption: text,
    },
    options,
    decorated: true,
  };
}

module.exports = {
  createArtBuffer,
  decorateReplyPayload,
  decorateSendMessagePayload,
  normalizeKey,
};
