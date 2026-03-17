const {
  API_BASE,
  apiGet,
  getCooldownRemaining,
  isSpotifyUrl,
  resolveCommandInput,
  safeFileName,
} = require("../../lib/dvyerApi");

const API_SPOTIFY_URL = `${API_BASE}/spotify`;
const COOLDOWN_TIME = 15 * 1000;
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
    downloadInput:
      String(data?.spotify_url || data?.selected?.spotify_url || "").trim() || cleanInput,
  };
}

module.exports = {
  command: ["spotify", "sp", "spoti"],
  categoria: "descarga",
  description: "Busca musica y deja lista la descarga con tu API",

  run: async (client, m, args) => {
    const userId = `${m.sender}:spotify-search`;
    const until = cooldowns.get(userId);

    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `Espera ${getCooldownRemaining(until)}s antes de usar Spotify otra vez.`,
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
          "Uso: .spotify <cancion, artista o link de Spotify>",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Buscando en Spotify...\nAPI: ${API_BASE}`,
        m,
        global.channelInfo,
      );

      const info = await requestSpotifyInfo(userInput);
      const captionLines = [
        "SPOTIFY",
        "",
        `Titulo: ${info.title}`,
        `Artista: ${info.artist}`,
      ];

      if (info.duration) {
        captionLines.push(`Duracion: ${info.duration}`);
      }

      captionLines.push("", "Elige descargar el MP3.");

      const buttons = [
        {
          buttonId: `.spdl ${info.downloadInput}`,
          buttonText: { displayText: "Descargar MP3" },
          type: 1,
        },
      ];

      const message = info.thumbnail
        ? {
            image: { url: info.thumbnail },
            caption: captionLines.join("\n"),
            buttons,
            footer: `API: ${API_BASE}`,
            headerType: 4,
          }
        : {
            text: captionLines.join("\n"),
            buttons,
            footer: `API: ${API_BASE}`,
            headerType: 1,
          };

      await client.sendMessage(
        m.chat,
        message,
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("SPOTIFY SEARCH ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "No se pudo buscar la cancion."),
        m,
        global.channelInfo,
      );
    }
  },
};
