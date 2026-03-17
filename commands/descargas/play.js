const yts = require("yt-search");

const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

module.exports = {
  command: ["play"],
  categoria: "descarga",
  description: "Buscar en YouTube",

  run: async (client, m, args) => {
    const userId = m.sender;

    if (cooldowns.has(userId)) {
      const expire = cooldowns.get(userId);
      const remaining = expire - Date.now();

      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de volver a usar este comando.`,
          m,
        );
      }
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "⚠️ Ingresa el nombre o URL de la cancion.",
          m,
        );
      }

      const query = args.join(" ");
      const search = await yts(query);

      if (!search.videos || !search.videos.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ No se encontraron resultados.",
          m,
        );
      }

      const video = search.videos[0];
      const safeThumbnail = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

      const caption =
        `╭━━━━━━━━《 SonGokuBot YT 》━━━━━━━━╮\n` +
        `┃ Titulo : ${video.title}\n` +
        `┃ Canal  : ${video.author.name}\n` +
        `┃ Tiempo : ${video.timestamp}\n` +
        `┃ Vistas : ${video.views.toLocaleString()}\n` +
        `┃ URL    : ${video.url}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `👇 Elige como recibir el contenido`;

      const buttons = [
        {
          buttonId: `.ytmp3 ${video.url}`,
          buttonText: { displayText: "🎵 YTMP3" },
          type: 1,
        },
        {
          buttonId: `.ytmp4 ${video.url}`,
          buttonText: { displayText: "🎬 YTMP4" },
          type: 1,
        },
        {
          buttonId: `.ytmp4doc ${video.url}`,
          buttonText: { displayText: "📂 Documento" },
          type: 1,
        },
      ];

      try {
        await client.sendMessage(
          m.chat,
          {
            image: { url: safeThumbnail },
            caption,
            buttons,
            footer: "🐲 SonGokuBot • Descargas YouTube • DVYER 🐲",
            headerType: 4,
          },
          { quoted: m },
        );
      } catch (error) {
        await client.sendMessage(
          m.chat,
          {
            text: caption,
            buttons,
            footer: "🐲 SonGokuBot • Descargas YouTube • DVYER 🐲",
            headerType: 1,
          },
          { quoted: m },
        );
      }
    } catch (error) {
      console.error("PLAY ERROR:", error);
      cooldowns.delete(userId);

      client.reply(
        m.chat,
        "❌ Error en la busqueda.",
        m,
      );
    }
  },
};
