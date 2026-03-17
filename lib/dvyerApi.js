const fs = require("fs");
const os = require("os");
const path = require("path");
const dns = require("dns").promises;
const net = require("net");
const axios = require("axios");
const { pipeline } = require("stream/promises");
const { spawn } = require("child_process");

const API_BASE = String(
  process.env.DVYER_API_BASE || global.api?.baseUrl || "https://dv-yer-api.online",
)
  .trim()
  .replace(/\/+$/, "");
const API_KEY = String(process.env.DVYER_API_KEY || global.api?.key || "").trim();
const REQUEST_TIMEOUT = Number(
  process.env.DVYER_API_TIMEOUT || global.api?.requestTimeout || 120000,
);
const SEARCH_ENDPOINT = `${API_BASE}/ytsearch`;
const TMP_ROOT = path.join(os.tmpdir(), "songokubot-dvyer");

const AUDIO_ENDPOINTS = [
  {
    endpoint: `${API_BASE}/ytdlmp3`,
    params: (videoUrl, quality) => ({ mode: "link", quality, url: videoUrl }),
  },
  {
    endpoint: `${API_BASE}/ytmp3`,
    params: (videoUrl, quality) => ({ mode: "link", quality, url: videoUrl }),
  },
  {
    endpoint: `${API_BASE}/ytdl`,
    params: (videoUrl, quality) => ({ type: "audio", quality, url: videoUrl }),
  },
];

const VIDEO_ENDPOINTS = [
  {
    endpoint: `${API_BASE}/ytdlmp4`,
    params: (videoUrl, quality) => ({ mode: "link", quality, url: videoUrl }),
  },
  {
    endpoint: `${API_BASE}/ytmp4`,
    params: (videoUrl, quality) => ({ mode: "link", quality, url: videoUrl }),
  },
  {
    endpoint: `${API_BASE}/ytdl`,
    params: (videoUrl, quality) => ({ type: "video", quality, url: videoUrl }),
  },
];

if (!fs.existsSync(TMP_ROOT)) {
  fs.mkdirSync(TMP_ROOT, { recursive: true });
}

function buildApiHeaders(extraHeaders = {}) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    Referer: `${API_BASE}/`,
    ...extraHeaders,
  };

  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }

  return headers;
}

function extractApiError(data, status) {
  return (
    data?.detail ||
    data?.error?.message ||
    data?.error ||
    data?.message ||
    data?.result?.message ||
    (status ? `HTTP ${status}` : "Error de API")
  );
}

function safeFileName(name) {
  return (
    String(name || "file")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "file"
  );
}

function stripExtension(name) {
  return String(name || "").replace(/\.[^.]+$/i, "");
}

function normalizeMp3Name(name) {
  return `${safeFileName(stripExtension(name || "audio")) || "audio"}.mp3`;
}

function normalizeMp4Name(name) {
  return `${safeFileName(stripExtension(name || "video")) || "video"}.mp4`;
}

function ensureTmpDir(name) {
  const finalDir = path.join(TMP_ROOT, name);

  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }

  return finalDir;
}

function deleteFileSafe(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
}

function normalizeApiUrl(url) {
  const value = String(url || "").trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE}${value}`;

  return `${API_BASE}/${value}`;
}

function pickApiDownloadUrl(data) {
  return (
    data?.download_url_full ||
    data?.stream_url_full ||
    data?.download_url ||
    data?.stream_url ||
    data?.url ||
    data?.result?.download_url_full ||
    data?.result?.stream_url_full ||
    data?.result?.download_url ||
    data?.result?.stream_url ||
    data?.result?.url ||
    ""
  );
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function extractYouTubeUrl(text) {
  const match = String(text || "").match(
    /https?:\/\/(?:www\.)?(?:youtube\.com|music\.youtube\.com|youtu\.be)\/[^\s]+/i,
  );

  return match ? match[0].trim() : "";
}

function getCooldownRemaining(untilMs) {
  return Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
}

function formatDurationLabel(input) {
  const totalSeconds = Number(input || 0);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "Desconocido";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function isPrivateIpv4(value) {
  const parts = String(value || "")
    .split(".")
    .map((item) => Number(item));

  if (parts.length !== 4 || parts.some((item) => !Number.isInteger(item))) {
    return false;
  }

  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 0) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}

function isPrivateIpv6(value) {
  const normalized = String(value || "").toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isPrivateIpAddress(value) {
  const family = net.isIP(value);
  if (family === 4) return isPrivateIpv4(value);
  if (family === 6) return isPrivateIpv6(value);
  return false;
}

async function assertSafeRemoteUrl(rawUrl) {
  const parsed = new URL(String(rawUrl || "").trim());
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Solo se permiten enlaces http o https.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname === "host.docker.internal"
  ) {
    throw new Error("No se permiten enlaces locales o privados.");
  }

  if (isPrivateIpAddress(hostname)) {
    throw new Error("No se permiten enlaces locales o privados.");
  }

  try {
    const resolved = await dns.lookup(hostname, { all: true });
    if (resolved.some((entry) => isPrivateIpAddress(entry.address))) {
      throw new Error("No se permiten enlaces locales o privados.");
    }
  } catch (error) {
    if (/locales o privados/i.test(String(error?.message || ""))) {
      throw error;
    }
  }

  return parsed.toString();
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

async function apiGet(url, params, timeout = 35000, extraHeaders = {}) {
  const response = await axios.get(url, {
    timeout,
    params,
    headers: buildApiHeaders(extraHeaders),
    validateStatus: () => true,
  });

  const data = response.data;

  if (response.status >= 400) {
    throw new Error(extractApiError(data, response.status));
  }

  if (data?.ok === false || data?.status === false) {
    throw new Error(extractApiError(data, response.status));
  }

  return data;
}

async function resolveYouTubeSearch(query) {
  const data = await apiGet(SEARCH_ENDPOINT, { q: query, limit: 1 }, 25000);
  const first = data?.results?.[0];

  if (!first?.url) {
    throw new Error("No se encontro ningun resultado en YouTube.");
  }

  return {
    videoUrl: first.url,
    title: safeFileName(first.title || "media"),
    thumbnail: first.thumbnail || null,
    duration: first.duration_seconds || null,
    durationLabel: formatDurationLabel(first.duration_seconds || 0),
    channel: String(first.channel || "").trim() || "Desconocido",
    views: Number(first.views || 0) || 0,
    uploadDate: String(first.upload_date || "").trim() || "Reciente",
    videoId: String(first.video_id || "").trim() || null,
  };
}

async function requestCandidate(config, videoUrl, quality) {
  const data = await apiGet(config.endpoint, config.params(videoUrl, quality), 50000);
  const resolvedDownloadUrl = normalizeApiUrl(pickApiDownloadUrl(data));

  if (!resolvedDownloadUrl) {
    throw new Error("La API no devolvio un enlace de descarga valido.");
  }

  return {
    endpoint: config.endpoint,
    resolvedDownloadUrl,
    title: safeFileName(data?.title || data?.result?.title || "media"),
    duration: String(data?.duration || data?.result?.duration || "").trim() || null,
    thumbnail: data?.thumbnail || data?.result?.thumbnail || null,
    fileName: String(data?.filename || data?.result?.filename || "").trim() || null,
  };
}

async function resolveFastestAudio(videoUrl, quality = "128k") {
  try {
    return await Promise.any(
      AUDIO_ENDPOINTS.map((config) => requestCandidate(config, videoUrl, quality)),
    );
  } catch (error) {
    const messages = Array.isArray(error?.errors)
      ? error.errors.map((item) => String(item?.message || item || "")).filter(Boolean)
      : [];

    throw new Error(
      messages[0] || "No se pudo preparar el audio con la API de YouTube.",
    );
  }
}

async function resolveFastestVideo(videoUrl, quality = "360p") {
  try {
    return await Promise.any(
      VIDEO_ENDPOINTS.map((config) => requestCandidate(config, videoUrl, quality)),
    );
  } catch (error) {
    const messages = Array.isArray(error?.errors)
      ? error.errors.map((item) => String(item?.message || item || "")).filter(Boolean)
      : [];

    throw new Error(
      messages[0] || "No se pudo preparar el video con la API de YouTube.",
    );
  }
}

async function downloadStreamToFile(response, outputPath, maxBytes, minBytes = 50000) {
  const contentLength = Number(response.headers?.["content-length"] || 0);

  if (contentLength && contentLength > maxBytes) {
    throw new Error("El archivo es demasiado grande para WhatsApp.");
  }

  let downloaded = 0;

  response.data.on("data", (chunk) => {
    downloaded += chunk.length;

    if (downloaded > maxBytes) {
      response.data.destroy(new Error("El archivo supera el tamano permitido."));
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

  if (!size || size < minBytes) {
    deleteFileSafe(outputPath);
    throw new Error("El archivo descargado es invalido o incompleto.");
  }

  if (size > maxBytes) {
    deleteFileSafe(outputPath);
    throw new Error("El archivo supera el tamano permitido.");
  }

  return {
    tempPath: outputPath,
    size,
    contentType: String(response.headers?.["content-type"] || "").trim() || null,
    fileName: path.basename(outputPath),
  };
}

async function downloadAbsoluteFile(downloadUrl, options) {
  const {
    outputPath,
    maxBytes,
    minBytes = 50000,
    timeout = REQUEST_TIMEOUT,
    maxRedirects = 5,
    headers = {},
  } = options;

  const safeUrl = await assertSafeRemoteUrl(downloadUrl);

  const response = await axios.get(safeUrl, {
    responseType: "stream",
    timeout,
    maxRedirects,
    headers: buildApiHeaders({ Accept: "*/*", ...headers }),
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    const errorText = await readStreamToText(response.data).catch(() => "");
    let parsed = null;

    try {
      parsed = JSON.parse(errorText);
    } catch {}

    throw new Error(
      extractApiError(
        parsed || { message: errorText || "No se pudo descargar el archivo." },
        response.status,
      ),
    );
  }

  return await downloadStreamToFile(response, outputPath, maxBytes, minBytes);
}

async function runFfmpeg(args, notInstalledMessage) {
  return await new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let errorText = "";

    ffmpeg.stderr.on("data", (chunk) => {
      errorText += chunk.toString();
    });

    ffmpeg.on("error", (error) => {
      if (error?.code === "ENOENT") {
        reject(new Error(notInstalledMessage));
        return;
      }

      reject(error);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(errorText.trim() || `ffmpeg salio con codigo ${code}`));
    });
  });
}

async function convertToMp3(inputPath, outputPath, bitrate = "128k") {
  await runFfmpeg(
    [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      bitrate,
      "-ar",
      "44100",
      "-map_metadata",
      "-1",
      "-loglevel",
      "error",
      outputPath,
    ],
    "ffmpeg no esta instalado en el servidor o en la PC.",
  );
}

async function convertToVoiceNote(inputPath, outputPath) {
  await runFfmpeg(
    [
      "-y",
      "-i",
      inputPath,
      "-ac",
      "1",
      "-ar",
      "48000",
      "-c:a",
      "libopus",
      "-b:a",
      "64k",
      "-loglevel",
      "error",
      outputPath,
    ],
    "ffmpeg no esta instalado en el servidor o en la PC.",
  );
}

async function normalizeVideoForWhatsApp(inputPath, outputPath) {
  return await new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        "-loglevel",
        "error",
        outputPath,
      ],
      {
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    ffmpeg.on("error", (error) => {
      if (error?.code === "ENOENT") {
        resolve(false);
        return;
      }

      reject(error);
    });

    ffmpeg.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

async function sendAudioFile(client, chat, quoted, options) {
  const {
    filePath,
    title,
    fileName = normalizeMp3Name(title || "audio"),
    size = 0,
    documentThreshold = Infinity,
    caption = null,
  } = options;

  if (size > documentThreshold) {
    await client.sendMessage(
      chat,
      {
        document: { url: filePath },
        mimetype: "audio/mpeg",
        fileName,
        caption: caption || `${global.namebot || "SonGokuBot"}\n\n${title || fileName}`,
      },
      quoted,
    );
    return "document";
  }

  try {
    await client.sendMessage(
      chat,
      {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName,
      },
      quoted,
    );
    return "audio";
  } catch (error) {
    await client.sendMessage(
      chat,
      {
        document: { url: filePath },
        mimetype: "audio/mpeg",
        fileName,
        caption: caption || `${global.namebot || "SonGokuBot"}\n\n${title || fileName}`,
      },
      quoted,
    );
    return "document";
  }
}

async function sendVideoOrDocument(client, chat, quoted, options) {
  const {
    filePath,
    fileName,
    title,
    caption = null,
    documentThreshold = 70 * 1024 * 1024,
    size = 0,
  } = options;

  const finalCaption = caption || `${global.namebot || "SonGokuBot"}\n\n${title || fileName}`;

  if (size > documentThreshold) {
    await client.sendMessage(
      chat,
      {
        document: { url: filePath },
        mimetype: "video/mp4",
        fileName,
        caption: finalCaption,
      },
      quoted,
    );
    return "document";
  }

  try {
    await client.sendMessage(
      chat,
      {
        video: { url: filePath },
        mimetype: "video/mp4",
        fileName,
        caption: finalCaption,
      },
      quoted,
    );
    return "video";
  } catch (error) {
    await client.sendMessage(
      chat,
      {
        document: { url: filePath },
        mimetype: "video/mp4",
        fileName,
        caption: finalCaption,
      },
      quoted,
    );
    return "document";
  }
}

module.exports = {
  API_BASE,
  API_KEY,
  REQUEST_TIMEOUT,
  buildApiHeaders,
  safeFileName,
  stripExtension,
  normalizeMp3Name,
  normalizeMp4Name,
  ensureTmpDir,
  deleteFileSafe,
  normalizeApiUrl,
  pickApiDownloadUrl,
  isHttpUrl,
  extractYouTubeUrl,
  getCooldownRemaining,
  formatDurationLabel,
  assertSafeRemoteUrl,
  apiGet,
  resolveYouTubeSearch,
  resolveFastestAudio,
  resolveFastestVideo,
  downloadAbsoluteFile,
  convertToMp3,
  convertToVoiceNote,
  normalizeVideoForWhatsApp,
  sendAudioFile,
  sendVideoOrDocument,
};
