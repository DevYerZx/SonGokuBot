const fs = require("fs");
const path = require("path");
const {
  API_BASE,
  apiGet,
  convertToMp3,
  deleteFileSafe,
  downloadApiFile,
  ensureTmpDir,
  getCooldownRemaining,
  isSpotifyUrl,
  normalizeMp3Name,
  resolveCommandInput,
  safeFileName,
  sendAudioFile,
} = require("../../lib/dvyerApi");

const API_SPOTIFY_URL = `${API_BASE}/spotify`;
const COOLDOWN_TIME = 15 * 1000;
const MAX_AUDIO_BYTES = 120 * 1024 * 1024;
const AUDIO_AS_DOCUMENT_THRESHOLD = 60 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("spotify");
const cooldowns = new Map();

async function requestSpotifyInfo(input) {
  const cleanInput = String(input || "").trim();
  const params = {
    mode: "link",
    pick: 1,
    limit: 5,
    lang: "es3",
  };

  if (isSpotifyUrl(cleanInput)) {
    params.url = cleanInput;
  } else {
    params.q = cleanInput;
  }

  const data = await apiGet(API_SPOTIFY_URL, params, 45000);

  return {
    title: safeFileName(data?.title || data?.selected?.title || "spotify"),
    artist: String(data?.artist || data?.selected?.artist || "Desconocido").trim() || "Desconocido",
    duration: String(data?.duration || data?.selected?.duration || "").trim() || null,
    thumbnail: data?.thumbnail || data?.selected?.thumbnail || null,
    fileName: normalizeMp3Name(data?.filename || data?.selected?.filename || "spotify.mp3"),
    params,
  };
}

module.exports = {
  command: ["spdl", "spotifydl"],
  categoria: "descarga",
  description: "Descarga audio de Spotify con tu API nueva",

  run: async (client, m, args) => {
    const userId = `${m.sender}:spotify-download`;
    const until = cooldowns.get(userId);
    let sourcePath = null;
    let finalPath = null;

    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `Espera ${getCooldownRemaining(until)}s antes de volver a descargar.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const userInput = resolveCommandInput(args, m);

      if (!userInput) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "Uso: .spdl <cancion, artista o link de Spotify>",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Preparando Spotify...\nAPI: ${API_BASE}`,
        m,
        global.channelInfo,
      );

      const info = await requestSpotifyInfo(userInput);

      if (info.thumbnail) {
        const previewLines = [
          "SPOTIFY MP3",
          "",
          `Titulo: ${info.title}`,
          `Artista: ${info.artist}`,
        ];

        if (info.duration) {
          previewLines.push(`Duracion: ${info.duration}`);
        }

        await client.sendMessage(
          m.chat,
          {
            image: { url: info.thumbnail },
            caption: previewLines.join("\n"),
          },
          { quoted: m, ...global.channelInfo },
        );
      }

      sourcePath = path.join(TMP_DIR, `${Date.now()}-spotify-source.bin`);
      finalPath = path.join(TMP_DIR, `${Date.now()}-spotify.mp3`);

      await downloadApiFile(API_SPOTIFY_URL, {
        params: {
          ...info.params,
          mode: "file",
        },
        outputPath: sourcePath,
        maxBytes: MAX_AUDIO_BYTES,
        minBytes: 50000,
      });

      await convertToMp3(sourcePath, finalPath, "128k");
      const finalSize = fs.existsSync(finalPath)
        ? fs.statSync(finalPath).size
        : 0;

      await sendAudioFile(
        client,
        m.chat,
        { quoted: m, ...global.channelInfo },
        {
          filePath: finalPath,
          fileName: normalizeMp3Name(info.fileName),
          title: `${info.title} - ${info.artist}`,
          size: finalSize,
          documentThreshold: AUDIO_AS_DOCUMENT_THRESHOLD,
          caption: `Spotify\n\n${info.title}\n${info.artist}`,
        },
      );
    } catch (error) {
      console.error("SPOTIFY DOWNLOAD ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "No se pudo descargar el audio."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(sourcePath);
      deleteFileSafe(finalPath);
    }
  },
};
