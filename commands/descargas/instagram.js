const path = require("path");
const {
  API_BASE,
  apiGet,
  deleteFileSafe,
  downloadApiFile,
  ensureTmpDir,
  extractInstagramUrl,
  getCooldownRemaining,
  mimeFromFileName,
  resolveCommandInput,
  safeFileName,
  sendVideoOrDocument,
} = require("../../lib/dvyerApi");

const API_INSTAGRAM_URL = `${API_BASE}/instagram`;
const API_LANG = "es";
const COOLDOWN_TIME = 15 * 1000;
const MAX_MEDIA_BYTES = 120 * 1024 * 1024;
const VIDEO_AS_DOCUMENT_THRESHOLD = 45 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("instagram");
const cooldowns = new Map();

function normalizeFileName(name, fallback = "instagram-media") {
  const raw = String(name || fallback).trim();
  const extMatch = raw.match(/(\.[a-z0-9]{1,10})$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : ".mp4";
  const base = safeFileName(raw.replace(/\.[^.]+$/i, "") || fallback);
  return `${base}${ext}`;
}

function isImageFile(fileName, contentType) {
  const mime = String(contentType || "").toLowerCase();
  if (mime.startsWith("image/") && !mime.includes("webp")) {
    return true;
  }

  return /\.(jpg|jpeg|png|gif)$/i.test(String(fileName || ""));
}

async function requestInstagramMeta(postUrl) {
  const data = await apiGet(
    API_INSTAGRAM_URL,
    {
      mode: "link",
      pick: 1,
      lang: API_LANG,
      url: postUrl,
    },
    45000,
  );

  return {
    title: safeFileName(data?.title || "instagram"),
    username: String(data?.username || "").trim() || "Desconocido",
    description: String(data?.description || "").trim() || null,
    thumbnail: data?.thumbnail || null,
    fileName: normalizeFileName(
      data?.filename || data?.selected?.filename || "instagram-media.mp4",
    ),
  };
}

module.exports = {
  command: ["ig", "instagram"],
  categoria: "descarga",
  description: "Descarga publicaciones de Instagram con tu API",

  run: async (client, m, args) => {
    const userId = `${m.sender}:instagram`;
    const until = cooldowns.get(userId);
    let tempPath = null;

    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `Espera ${getCooldownRemaining(until)}s antes de volver a usar Instagram.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const rawInput = resolveCommandInput(args, m);
      const postUrl = extractInstagramUrl(rawInput);

      if (!postUrl) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "Uso: .instagram <link publico de Instagram> o responde a un mensaje con el link",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Preparando Instagram...\nAPI: ${API_BASE}`,
        m,
        global.channelInfo,
      );

      const info = await requestInstagramMeta(postUrl);
      const previewLines = [
        "Instagram",
        "",
        `Usuario: ${info.username}`,
        `Titulo: ${info.title}`,
      ];

      if (info.description) {
        previewLines.push("", info.description.slice(0, 500));
      }

      if (info.thumbnail) {
        await client.sendMessage(
          m.chat,
          {
            image: { url: info.thumbnail },
            caption: previewLines.join("\n"),
          },
          { quoted: m, ...global.channelInfo },
        );
      }

      tempPath = path.join(TMP_DIR, `${Date.now()}-${info.fileName}`);
      const downloaded = await downloadApiFile(API_INSTAGRAM_URL, {
        params: {
          mode: "file",
          pick: 1,
          lang: API_LANG,
          url: postUrl,
        },
        outputPath: tempPath,
        maxBytes: MAX_MEDIA_BYTES,
        minBytes: 1,
      });

      const finalFileName = normalizeFileName(downloaded.fileName || info.fileName);
      const caption = `Instagram\n\nUsuario: ${info.username}\nTitulo: ${info.title}`;

      if (isImageFile(finalFileName, downloaded.contentType)) {
        await client.sendMessage(
          m.chat,
          {
            image: { url: downloaded.tempPath },
            mimetype: mimeFromFileName(finalFileName),
            caption,
          },
          { quoted: m, ...global.channelInfo },
        );
        return;
      }

      await sendVideoOrDocument(
        client,
        m.chat,
        { quoted: m, ...global.channelInfo },
        {
          filePath: downloaded.tempPath,
          fileName: finalFileName,
          title: info.title,
          size: downloaded.size,
          documentThreshold: VIDEO_AS_DOCUMENT_THRESHOLD,
          caption,
        },
      );
    } catch (error) {
      console.error("INSTAGRAM ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "No se pudo procesar la publicacion."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(tempPath);
    }
  },
};
