const path = require("path");
const {
  API_BASE,
  apiGet,
  deleteFileSafe,
  downloadApiFile,
  ensureTmpDir,
  extractMediaFireUrl,
  getCooldownRemaining,
  humanBytes,
  mimeFromFileName,
  normalizeApiUrl,
  pickApiDownloadUrl,
  resolveCommandInput,
  safeFileName,
} = require("../../lib/dvyerApi");

const API_MEDIAFIRE_URL = `${API_BASE}/mediafire`;
const COOLDOWN_TIME = 15 * 1000;
const MAX_FILE_BYTES = 300 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("mediafire");
const cooldowns = new Map();

function normalizeFileName(name, fallback = "mediafire-file") {
  const raw = String(name || fallback).trim();
  const extMatch = raw.match(/(\.[a-z0-9]{1,10})$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const base = safeFileName(raw.replace(/\.[^.]+$/i, "") || fallback);
  return `${base}${ext}`;
}

function parseSizeToBytes(sizeLabel) {
  const text = String(sizeLabel || "").trim().toUpperCase().replace(/\s+/g, "");
  const match = text.match(/^([\d.]+)(B|KB|MB|GB|TB)$/);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };

  if (!Number.isFinite(value) || !multipliers[unit]) {
    return null;
  }

  return Math.round(value * multipliers[unit]);
}

async function requestMediafireMeta(fileUrl) {
  const data = await apiGet(
    API_MEDIAFIRE_URL,
    {
      mode: "link",
      url: fileUrl,
    },
    45000,
  );

  return {
    title: safeFileName(data?.title || data?.filename || "MediaFire"),
    fileName: normalizeFileName(data?.filename || "mediafire-file"),
    fileSize: String(data?.filesize || "").trim() || null,
    format: String(data?.format || "").trim() || null,
    downloadUrl: normalizeApiUrl(pickApiDownloadUrl(data)),
  };
}

module.exports = {
  command: ["mediafire", "mf"],
  categoria: "descarga",
  description: "Descarga archivos publicos de MediaFire con tu API",

  run: async (client, m, args) => {
    const userId = `${m.sender}:mediafire`;
    const until = cooldowns.get(userId);
    let tempPath = null;

    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `Espera ${getCooldownRemaining(until)}s antes de volver a usar MediaFire.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const rawInput = resolveCommandInput(args, m);
      const fileUrl = extractMediaFireUrl(rawInput);

      if (!fileUrl) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "Uso: .mediafire <link publico de MediaFire> o responde a un mensaje con el link",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Preparando MediaFire...\nAPI: ${API_BASE}`,
        m,
        global.channelInfo,
      );

      const info = await requestMediafireMeta(fileUrl);
      const sizeBytes = parseSizeToBytes(info.fileSize);

      if (sizeBytes && sizeBytes > MAX_FILE_BYTES) {
        return client.sendMessage(
          m.chat,
          {
            text:
              `MediaFire\n\n` +
              `Archivo: ${info.fileName}\n` +
              `Tamano: ${info.fileSize}\n` +
              `Formato: ${info.format || "Desconocido"}\n\n` +
              `El archivo supera el limite configurado para enviarlo por WhatsApp.\n` +
              `Link: ${info.downloadUrl || fileUrl}`,
          },
          { quoted: m, ...global.channelInfo },
        );
      }

      tempPath = path.join(TMP_DIR, `${Date.now()}-${info.fileName}`);
      const downloaded = await downloadApiFile(API_MEDIAFIRE_URL, {
        params: {
          mode: "file",
          url: fileUrl,
        },
        outputPath: tempPath,
        maxBytes: MAX_FILE_BYTES,
        minBytes: 1,
      });

      const finalFileName = normalizeFileName(downloaded.fileName || info.fileName);
      const sizeLabel = info.fileSize || humanBytes(downloaded.size) || "Desconocido";

      await client.sendMessage(
        m.chat,
        {
          document: { url: downloaded.tempPath },
          mimetype: mimeFromFileName(finalFileName),
          fileName: finalFileName,
          caption:
            `MediaFire\n\n` +
            `Archivo: ${info.title}\n` +
            `Tamano: ${sizeLabel}\n` +
            `Formato: ${info.format || "Desconocido"}`,
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("MEDIAFIRE ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "No se pudo procesar el archivo."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(tempPath);
    }
  },
};
