const { resolveYouTubeSearch } = require("../../lib/dvyerApi");

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

      const result = await resolveYouTubeSearch(args.join(" "));
      const caption =
        `╭━━━━━━━━《 SonGokuBot YT 》━━━━━━━━╮\n` +
        `┃ Titulo : ${result.title}\n` +
        `┃ Canal  : ${result.channel}\n` +
        `┃ Tiempo : ${result.durationLabel}\n` +
        `┃ Vistas : ${result.views ? result.views.toLocaleString() : "No disponible"}\n` +
        `┃ Subido : ${result.uploadDate}\n` +
        `┃ URL    : ${result.videoUrl}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `👇 Elige como recibir el contenido`;

      const buttons = [
        {
          buttonId: `.ytmp3 ${result.videoUrl}`,
          buttonText: { displayText: "🎵 YTMP3" },
          type: 1,
        },
        {
          buttonId: `.ytmp4 ${result.videoUrl}`,
          buttonText: { displayText: "🎬 YTMP4" },
          type: 1,
        },
        {
          buttonId: `.ytmp4doc ${result.videoUrl}`,
          buttonText: { displayText: "📂 Documento" },
          type: 1,
        },
      ];

      try {
        await client.sendMessage(
          m.chat,
          {
            image: { url: result.thumbnail || global.thumbnailUrl },
            caption,
            buttons,
            footer: "🐲 SonGokuBot • Descargas YouTube • DVYER 🐲",
            headerType: 4,
          },
          { quoted: m },
        );
      } catch {
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
      client.reply(m.chat, "❌ Error en la busqueda.", m);
    }
  },
};
