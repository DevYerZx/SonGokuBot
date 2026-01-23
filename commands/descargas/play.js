const yts = require("yt-search");

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000; // 15 segundos

module.exports = {
  command: ["play"],
  categoria: "descarga",
  description: "Buscar en YouTube",

  run: async (client, m, args) => {
    const userId = m.sender;

    // 🔒 Verificar cooldown
    if (cooldowns.has(userId)) {
      const expire = cooldowns.get(userId);
      const remaining = expire - Date.now();

      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de volver a usar este comando.`,
          m
        );
      }
    }

    // ✅ Activar cooldown
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "⚠️ Ingresa el nombre o URL de la canción.",
          m
        );
      }

      const query = args.join(" ");
      const search = await yts(query);

      if (!search.videos || !search.videos.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ No se encontraron resultados.",
          m
        );
      }

      const video = search.videos[0];

      // ✅ Thumbnail seguro
      const safeThumbnail = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

      const caption =
        `╭━━━〔 ꕶONメＧOｋUメYT 〕━━━╮\n` +
        `┃ *メㅤTítulo :* ${video.title}\n` +
        `┃ *メ Canal:* ${video.author.name}\n` +
        `┃ *メ Duración:* ${video.timestamp}\n` +
        `┃ *メ Vistas:* ${video.views.toLocaleString()}\n` +
        `┃ *メ URL:* ${video.url}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `👇 Elige cómo recibir el contenidoㅤ〆`;

  const buttons = [
  {
    buttonId: `.ytaudio ${video.url}`,
    buttonText: { displayText: "🎵 Audio" },
    type: 1
  },
  {
    buttonId: `.ytvideo ${video.url}`,
    buttonText: { displayText: "🎬 Video" },
    type: 1
  },
  {
    buttonId: `.ytdoc ${video.url}`,
    buttonText: { displayText: "📂 Documento" },
    type: 1
  },
  {
    buttonId: `.ytquality ${video.url}`,
    buttonText: { displayText: "🎥 Video 720p" },
    type: 1
  }
];


      // 📤 Envío con fallback
      try {
        await client.sendMessage(
          m.chat,
          {
            image: { url: safeThumbnail },
            caption,
            buttons,
            footer: "🐲 SonGokuBot • Descargas YouTube • DVYER 🐲",
            headerType: 4
          },
          { quoted: m }
        );
      } catch (err) {
        console.log("Thumbnail falló, enviando sin imagen");

        await client.sendMessage(
          m.chat,
          {
            text: caption,
            buttons,
            footer: "🐲 SonGokuBot • Descargas YouTube • DVYER 🐲",
            headerType: 1
          },
          { quoted: m }
        );
      }

    } catch (e) {
      console.error("PLAY ERROR:", e);
      cooldowns.delete(userId);

      client.reply(
        m.chat,
        "❌ Error en la búsqueda.",
        m
      );
    }
  }
};

