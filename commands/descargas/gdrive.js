const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream/promises");
const {
  deleteFileSafe,
  ensureTmpDir,
  extractGoogleDriveUrl,
  getCooldownRemaining,
  humanBytes,
  mimeFromFileName,
  parseContentDispositionFileName,
  resolveCommandInput,
  safeFileName,
} = require("../../lib/dvyerApi");

const DRIVE_DOWNLOAD_URL = "https://drive.google.com/uc";
const DRIVE_DIRECT_URL = "https://drive.usercontent.google.com/download";
const REQUEST_TIMEOUT = 120000;
const MAX_FILE_BYTES = 300 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("gdrive");
const COOLDOWN_TIME = 15 * 1000;
const cooldowns = new Map();

function normalizeFileName(name, fallback = "google-drive-file") {
  const raw = String(name || fallback).trim();
  const extMatch = raw.match(/(\.[a-z0-9]{1,10})$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const base = safeFileName(raw.replace(/\.[^.]+$/i, "") || fallback);
  return `${base}${ext}`;
}

function extractDriveFileId(url) {
  const input = String(url || "").trim();
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/i,
    /[?&]id=([a-zA-Z0-9_-]{10,})/i,
    /\/d\/([a-zA-Z0-9_-]{10,})/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function buildDriveHeaders(cookieHeader = "") {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    Accept: "*/*",
    Referer: "https://drive.google.com/",
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return headers;
}

function isHtmlResponse(response) {
  const contentType = String(response.headers?.["content-type"] || "").toLowerCase();
  return contentType.includes("text/html") || contentType.includes("text/plain");
}

function isFileResponse(response) {
  return Boolean(response.headers?.["content-disposition"]) || !isHtmlResponse(response);
}

function parseCookieHeader(setCookieHeader) {
  if (!Array.isArray(setCookieHeader) || !setCookieHeader.length) {
    return "";
  }

  return setCookieHeader
    .map((entry) => String(entry || "").split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function parseConfirmToken(html) {
  const patterns = [
    /confirm=([0-9A-Za-z_-]+)&amp;id=/i,
    /confirm=([0-9A-Za-z_-]+)&id=/i,
    /name="confirm"\s+value="([^"]+)"/i,
    /"confirm":"([^"]+)"/i,
    /confirm=([0-9A-Za-z_-]+)\\u0026id=/i,
  ];

  for (const pattern of patterns) {
    const match = String(html || "").match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function sanitizeDriveErrorText(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const normalized = text.toLowerCase();

  if (
    normalized.includes("too many users have viewed") ||
    normalized.includes("too many users have downloaded")
  ) {
    return "Google Drive bloqueo temporalmente la descarga por exceso de trafico. Intenta mas tarde.";
  }

  if (
    normalized.includes("access denied") ||
    normalized.includes("you need access") ||
    normalized.includes("solicitar acceso")
  ) {
    return "El archivo de Google Drive no es publico o necesita permisos.";
  }

  if (normalized.includes("no se pudo extraer el archivo")) {
    return text;
  }

  return text || "No se pudo procesar el archivo de Google Drive.";
}

async function readStreamToText(stream) {
  return await new Promise((resolve, reject) => {
    let data = "";

    stream.on("data", (chunk) => {
      data += chunk.toString();
    });
    stream.on("end", () => resolve(data));
    stream.on("error", reject);
  });
}

async function requestDriveStream(url, params, cookieHeader = "") {
  return await axios.get(url, {
    params,
    timeout: REQUEST_TIMEOUT,
    responseType: "stream",
    maxRedirects: 5,
    headers: buildDriveHeaders(cookieHeader),
    validateStatus: () => true,
  });
}

async function openGoogleDriveDownload(fileId) {
  const firstResponse = await requestDriveStream(
    DRIVE_DIRECT_URL,
    {
      id: fileId,
      export: "download",
      confirm: "t",
    },
  );

  if (firstResponse.status >= 400) {
    throw new Error(`Google Drive respondio con HTTP ${firstResponse.status}.`);
  }

  if (isFileResponse(firstResponse)) {
    return firstResponse;
  }

  const firstHtml = await readStreamToText(firstResponse.data);
  const confirmToken = parseConfirmToken(firstHtml);
  const cookieHeader = parseCookieHeader(firstResponse.headers?.["set-cookie"]);

  if (!confirmToken) {
    throw new Error(sanitizeDriveErrorText(firstHtml));
  }

  const secondResponse = await requestDriveStream(
    DRIVE_DOWNLOAD_URL,
    {
      export: "download",
      id: fileId,
      confirm: confirmToken,
    },
    cookieHeader,
  );

  if (secondResponse.status >= 400) {
    throw new Error(`Google Drive respondio con HTTP ${secondResponse.status}.`);
  }

  if (!isFileResponse(secondResponse)) {
    const secondHtml = await readStreamToText(secondResponse.data);
    throw new Error(sanitizeDriveErrorText(secondHtml));
  }

  return secondResponse;
}

async function downloadGoogleDriveFile(fileId, outputPath) {
  const response = await openGoogleDriveDownload(fileId);
  const contentLength = Number(response.headers?.["content-length"] || 0);

  if (contentLength && contentLength > MAX_FILE_BYTES) {
    throw new Error("El archivo de Google Drive supera el limite para enviarlo por WhatsApp.");
  }

  let downloaded = 0;
  response.data.on("data", (chunk) => {
    downloaded += chunk.length;
    if (downloaded > MAX_FILE_BYTES) {
      response.data.destroy(
        new Error("El archivo de Google Drive supera el limite para enviarlo por WhatsApp."),
      );
    }
  });

  try {
    await pipeline(response.data, fs.createWriteStream(outputPath));
  } catch (error) {
    deleteFileSafe(outputPath);
    throw error;
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error("No se pudo guardar el archivo descargado.");
  }

  const size = fs.statSync(outputPath).size;
  if (!size || size < 1) {
    deleteFileSafe(outputPath);
    throw new Error("El archivo descargado es invalido.");
  }

  if (size > MAX_FILE_BYTES) {
    deleteFileSafe(outputPath);
    throw new Error("El archivo de Google Drive supera el limite para enviarlo por WhatsApp.");
  }

  return {
    tempPath: outputPath,
    size,
    fileName: normalizeFileName(
      parseContentDispositionFileName(response.headers?.["content-disposition"]) ||
        path.basename(outputPath),
    ),
  };
}

module.exports = {
  command: ["gdrive", "drive"],
  categoria: "descarga",
  description: "Descarga archivos publicos de Google Drive",

  run: async (client, m, args) => {
    const userId = `${m.sender}:gdrive`;
    const until = cooldowns.get(userId);
    let tempPath = null;

    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `Espera ${getCooldownRemaining(until)}s antes de volver a usar Google Drive.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const rawInput = resolveCommandInput(args, m);
      const driveUrl = extractGoogleDriveUrl(rawInput);
      const fileId = extractDriveFileId(driveUrl);

      if (!driveUrl || !fileId) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "Uso: .gdrive <link publico de Google Drive> o responde a un mensaje con el link",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        "Preparando Google Drive...\nIntentando obtener el archivo publico.",
        m,
        global.channelInfo,
      );

      tempPath = path.join(TMP_DIR, `${Date.now()}-${fileId}`);
      const downloaded = await downloadGoogleDriveFile(fileId, tempPath);
      const sizeLabel = humanBytes(downloaded.size) || "Desconocido";

      await client.sendMessage(
        m.chat,
        {
          document: { url: downloaded.tempPath },
          mimetype: mimeFromFileName(downloaded.fileName),
          fileName: downloaded.fileName,
          caption:
            `Google Drive\n\n` +
            `Archivo: ${downloaded.fileName}\n` +
            `Tamano: ${sizeLabel}`,
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("GDRIVE ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        sanitizeDriveErrorText(error?.message || error),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(tempPath);
    }
  },
};
