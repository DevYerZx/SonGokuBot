const yts = require("yt-search");

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

module.exports = {
  command: ["play2"],
  categoria: "descarga",
  description: "Buscar en YouTube y elegir formato",

  run: async (client, m, args) => {
    const userId = m.sender;

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const remaining = cooldowns.get(userId) - Date.now();
      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)}s*`,
          m,
          global.channelInfo
        );
      }
    }
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "⚠️ Escribe qué quieres buscar en YouTube",
          m,
          global.channelInfo
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
          global.channelInfo
        );
      }

      const video = search.videos[0];

      const thumb = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

      // 🎨 DISEÑO DIFERENTE
      const caption =
`╭─〔 📥 YTDL 〕─╮
│ 🎵 *${video.title}*
│ 👤 ${video.author.name}
│ ⏱️ ${video.timestamp}
│ 👁️ ${video.views.toLocaleString()} vistas
╰───────────────╯

👇 Elige el formato de descarga`;

      const buttons = [
        {
          buttonId: `.ytdlmp3 ${video.url}`,
          buttonText: { displayText: "🎵 Descargar MP3" },
          type: 1
        },
        {
          buttonId: `.ytdlmp4 ${video.url}`,
          buttonText: { displayText: "🎬 Descargar MP4" },
          type: 1
        }
      ];

      // 📤 Envío
      await client.sendMessage(
        m.chat,
        {
          image: { url: thumb },
          caption,
          buttons,
          footer: "🐲 SonGokuBot • YTDL • DVYER 🐲",
          headerType: 4
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTDL MENU ERROR:", err);
      cooldowns.delete(userId);

      client.reply(
        m.chat,
        "❌ Error al buscar en YouTube",
        m,
        global.channelInfo
      );
    }
  }
};