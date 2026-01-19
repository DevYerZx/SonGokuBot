const yts = require("yt-search");

module.exports = {
  command: ["play"],
  categoria: "descarga",
  description: "Buscar música en YouTube y enviar con diseño mejorado",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(m.chat, "⚠️ Ingresa el nombre o URL de la canción.", m);
      }

      const query = args.join(" ");
      const search = await yts(query);

      if (!search.videos || !search.videos.length) {
        return client.reply(m.chat, "❌ No se encontraron resultados.", m);
      }

      const video = search.videos[0];

      // ====== DISEÑO MEJORADO ======
      const caption =
        `╭━━━〔 🎬 SON GOKU BOT 🎬 〕━━━╮\n` +
        `┃ 📌 *Título:* ${video.title}\n` +
        `┃ 👤 *Canal:* ${video.author.name}\n` +
        `┃ ⏱ *Duración:* ${video.timestamp}\n` +
        `┃ 👁 *Vistas:* ${video.views.toLocaleString()}\n` +
        `┃ 🔗 *URL:* ${video.url}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `👇 Elige cómo recibir el contenido`;

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
        }
      ];

      await client.sendMessage(
        m.chat,
        {
          image: { url: video.thumbnail },
          caption,
          buttons,
          footer: "🐲 SonGokuBot • Descargas YouTube • DVYER 🐲",
          headerType: 4
        },
        { quoted: m }
      );
    } catch (e) {
      console.error("PLAY ERROR:", e);
      client.reply(m.chat, "❌ Error en la búsqueda.", m);
    }
  }
};

