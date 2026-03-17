const { resolveYouTubeSearch } = require("../../lib/dvyerApi");

const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

module.exports = {
  command: ["play2"],
  categoria: "descarga",
  description: "Buscar en YouTube y elegir formato",

  run: async (client, m, args) => {
    const userId = m.sender;

    if (cooldowns.has(userId)) {
      const remaining = cooldowns.get(userId) - Date.now();
      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)}s*`,
          m,
          global.channelInfo,
        );
      }
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "⚠️ Escribe que quieres buscar en YouTube",
          m,
          global.channelInfo,
        );
      }

      const result = await resolveYouTubeSearch(args.join(" "));
      const caption =
        `╭─《 📥 YTDL 》─╮\n` +
        `│ 🎵 *${result.title}*\n` +
        `│ 👤 ${result.channel}\n` +
        `│ ⏱️ ${result.durationLabel}\n` +
        `│ 👁️ ${result.views ? result.views.toLocaleString() : "No disponible"} vistas\n` +
        `╰──────────────╯\n\n` +
        `👇 Elige el formato de descarga`;

      const buttons = [
        {
          buttonId: `.ytmp3 ${result.videoUrl}`,
          buttonText: { displayText: "🎵 Descargar MP3" },
          type: 1,
        },
        {
          buttonId: `.ytmp4 ${result.videoUrl}`,
          buttonText: { displayText: "🎬 Descargar MP4" },
          type: 1,
        },
      ];

      await client.sendMessage(
        m.chat,
        {
          image: { url: result.thumbnail || global.thumbnailUrl },
          caption,
          buttons,
          footer: "🐲 SonGokuBot • YTDL • DVYER 🐲",
          headerType: 4,
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("YTDL MENU ERROR:", error);
      cooldowns.delete(userId);

      client.reply(
        m.chat,
        "❌ Error al buscar en YouTube",
        m,
        global.channelInfo,
      );
    }
  },
};
