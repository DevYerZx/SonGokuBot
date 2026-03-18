const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream/promises");
const { spawn } = require("child_process");

const API_BASE = String(
  process.env.DRAGONBALL_API_BASE ||
    global.dragonBallApi?.baseUrl ||
    "https://dragonball-api.com/api",
)
  .trim()
  .replace(/\/+$/, "");
const REQUEST_TIMEOUT = Number(
  process.env.DRAGONBALL_API_TIMEOUT ||
    global.dragonBallApi?.requestTimeout ||
    60000,
);
const TMP_ROOT = path.join(os.tmpdir(), "songokubot-dragonball");

if (!fs.existsSync(TMP_ROOT)) {
  fs.mkdirSync(TMP_ROOT, { recursive: true });
}

const http = axios.create({
  timeout: REQUEST_TIMEOUT,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    Referer: "https://web.dragonball-api.com/",
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function trimDescription(value, max = 560) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "Sin descripcion disponible.";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trim()}...`;
}

function assertDragonBallUrl(value) {
  const url = new URL(String(value || ""));
  const host = url.hostname.toLowerCase();

  if (
    !(
      host === "dragonball-api.com" ||
      host.endsWith(".dragonball-api.com") ||
      host === "web.dragonball-api.com"
    )
  ) {
    throw new Error("La imagen no viene de un host permitido.");
  }

  return url.toString();
}

function cleanupFiles(paths) {
  for (const filePath of paths) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}

function baseCharacter(item = {}) {
  return {
    id: Number(item.id || 0) || 0,
    name: String(item.name || "Personaje desconocido").trim(),
    ki: String(item.ki || "Desconocido").trim(),
    maxKi: String(item.maxKi || "Desconocido").trim(),
    race: String(item.race || "Desconocida").trim(),
    gender: String(item.gender || "Desconocido").trim(),
    description: trimDescription(item.description),
    image: String(item.image || "").trim(),
    affiliation: String(item.affiliation || "Desconocida").trim(),
    originPlanet: item.originPlanet || null,
    transformations: Array.isArray(item.transformations)
      ? item.transformations
          .map((transformation) => ({
            id: Number(transformation.id || 0) || 0,
            name: String(transformation.name || "Transformacion").trim(),
            image: String(transformation.image || "").trim(),
            ki: String(transformation.ki || "Desconocido").trim(),
          }))
          .filter((transformation) => transformation.name)
      : [],
  };
}

async function apiGet(resource, params = {}, attempt = 0) {
  const url = /^https?:\/\//i.test(String(resource || ""))
    ? String(resource)
    : `${API_BASE}${resource.startsWith("/") ? "" : "/"}${resource}`;

  try {
    const response = await http.get(url, { params });
    return response.data;
  } catch (error) {
    const isRetryable =
      !error.response || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

    if (attempt < 1 && isRetryable) {
      await sleep(1200);
      return apiGet(resource, params, attempt + 1);
    }

    const apiMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "No se pudo consultar la API de Dragon Ball.";

    throw new Error(apiMessage);
  }
}

function pickBestCharacter(query, items = []) {
  if (!items.length) return null;

  const wanted = cleanText(query);
  const exact = items.find((item) => cleanText(item.name) === wanted);
  if (exact) return exact;

  const startsWith = items.find((item) => cleanText(item.name).startsWith(wanted));
  if (startsWith) return startsWith;

  const includes = items.find((item) => cleanText(item.name).includes(wanted));
  return includes || items[0];
}

async function listCharacters(params = {}) {
  const data = await apiGet("/characters", params);
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return items.map(baseCharacter);
}

async function getCharacterById(id) {
  const data = await apiGet(`/characters/${Number(id)}`);
  return baseCharacter(data);
}

async function findCharacter(query) {
  const input = String(query || "").trim();
  if (!input) {
    throw new Error("Debes indicar un personaje o un id.");
  }

  if (/^\d+$/.test(input)) {
    return getCharacterById(Number(input));
  }

  const matches = await listCharacters({
    name: input,
    limit: 10,
  });

  if (!matches.length) {
    throw new Error(`No encontre personajes para "${input}".`);
  }

  const selected = pickBestCharacter(input, matches);
  if (!selected?.id) {
    throw new Error(`No pude resolver el personaje "${input}".`);
  }

  return getCharacterById(selected.id);
}

async function getRandomCharacter() {
  const items = await listCharacters({ limit: 100 });
  if (!items.length) {
    throw new Error("La API de Dragon Ball no devolvio personajes.");
  }

  const selected = items[Math.floor(Math.random() * items.length)];
  return getCharacterById(selected.id);
}

async function downloadToFile(url, targetPath) {
  const response = await http.get(url, { responseType: "stream" });
  await pipeline(response.data, fs.createWriteStream(targetPath));
}

async function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr.trim() || `ffmpeg termino con codigo ${code}`));
    });
  });
}

async function imageUrlToJpegBuffer(imageUrl) {
  const safeUrl = assertDragonBallUrl(imageUrl);
  const extension = path.extname(new URL(safeUrl).pathname).toLowerCase() || ".img";
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const inputPath = path.join(TMP_ROOT, `${token}${extension}`);
  const outputPath = path.join(TMP_ROOT, `${token}.jpg`);

  try {
    if (extension === ".jpg" || extension === ".jpeg") {
      const response = await http.get(safeUrl, { responseType: "arraybuffer" });
      return Buffer.from(response.data);
    }

    if (extension === ".png") {
      const response = await http.get(safeUrl, { responseType: "arraybuffer" });
      return Buffer.from(response.data);
    }

    await downloadToFile(safeUrl, inputPath);
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      outputPath,
    ]);

    return fs.readFileSync(outputPath);
  } finally {
    cleanupFiles([inputPath, outputPath]);
  }
}

function formatCharacterCaption(character, options = {}) {
  const label = options.isRandom ? "PERSONAJE DBZ RANDOM" : "PERSONAJE DBZ";
  const origin = character.originPlanet?.name
    ? `\nPlaneta: ${character.originPlanet.name}`
    : "";
  const transformations = character.transformations.length
    ? `\nTransformaciones: ${character.transformations.length}`
    : "\nTransformaciones: ninguna";

  return (
    `${label}\n\n` +
    `Nombre: ${character.name}\n` +
    `ID: ${character.id}\n` +
    `Raza: ${character.race}\n` +
    `Genero: ${character.gender}\n` +
    `Afiliacion: ${character.affiliation}\n` +
    `Ki: ${character.ki}\n` +
    `Max Ki: ${character.maxKi}` +
    origin +
    transformations +
    `\n\n${character.description}`
  );
}

function formatTransformationsList(character) {
  const list = character.transformations
    .map(
      (transformation, index) =>
        `${index + 1}. ${transformation.name} | Ki: ${transformation.ki}`,
    )
    .join("\n");

  return (
    `TRANSFORMACIONES DBZ\n\n` +
    `Personaje: ${character.name}\n` +
    `Total: ${character.transformations.length}\n\n` +
    `${list}\n\n` +
    `Uso: .transformacionesdbz ${character.id} 1`
  );
}

function formatTransformationCaption(character, transformation, index) {
  return (
    `TRANSFORMACION DBZ\n\n` +
    `Personaje: ${character.name}\n` +
    `Forma: ${transformation.name}\n` +
    `Indice: ${index + 1}/${character.transformations.length}\n` +
    `Ki: ${transformation.ki}\n\n` +
    `Usa .transformacionesdbz ${character.id} para ver toda la lista.`
  );
}

module.exports = {
  API_BASE,
  REQUEST_TIMEOUT,
  listCharacters,
  getCharacterById,
  findCharacter,
  getRandomCharacter,
  imageUrlToJpegBuffer,
  formatCharacterCaption,
  formatTransformationsList,
  formatTransformationCaption,
};
