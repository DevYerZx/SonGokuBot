const yts = require("yt-search");

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

      const query = args.join(" ");
      const search = await yts(query);

      if (!search.videos || !search.videos.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ No se encontraron resultados",
          m,
          global.channelInfo,
        );
      }

      const video = search.videos[0];
      const thumb = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

      const caption =
        `╭─《 📥 YTDL 》─╮\n` +
        `│ 🎵 *${video.title}*\n` +
        `│ 👤 ${video.author.name}\n` +
        `│ ⏱️ ${video.timestamp}\n` +
        `│ 👁️ ${video.views.toLocaleString()} vistas\n` +
        `╰──────────────╯\n\n` +
        `👇 Elige el formato de descarga`;

      const buttons = [
        {
          buttonId: `.ytmp3 ${video.url}`,
          buttonText: { displayText: "🎵 Descargar MP3" },
          type: 1,
        },
        {
          buttonId: `.ytmp4 ${video.url}`,
          buttonText: { displayText: "🎬 Descargar MP4" },
          type: 1,
        },
      ];

      await client.sendMessage(
        m.chat,
        {
          image: { url: thumb },
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
