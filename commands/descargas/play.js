const yts = require("yt-search");

module.exports = {
  command: ["play"],
  categoria: "descarga",
  description: "Buscar música /video  en YouTube",

  run: async (client, m, args) => {
    try {
      if (!args.length)
        return client.reply(m.chat, "⚠️ Ingresa el nombre de la canción.", m);

      const query = args.join(" ");
      const search = await yts(query);

      if (!search.videos || !search.videos.length)
        return client.reply(m.chat, "❌ No se encontraron resultados.", m);

      // 🔹 Guardamos resultados por si luego quieres usar
      global.youtubeSearches.set(m.sender, {
        results: search.videos,
        index: 0
      });

      const video = search.videos[0];

      // 🎨 Diseño del mensaje
      const caption = `
╭━━━〔 🎶 SonGokuBot 🎶 〕━━━╮
│
│ 🎬 *Título:* ${video.title}
│ 👤 *Canal:* ${video.author.name}
│ ⏱ *Duración:* ${video.timestamp}
│ 👁 *Vistas:* ${video.views.toLocaleString()}
│ 🌐 *URL:* ${video.url}
│
╰─────────────────────────╯
👇 Elige una opción para recibir tu contenido
`;

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
          footer: "🐉 SonGokuBot • Descargas YouTube • DVYER 🐉",
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

