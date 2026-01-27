const axios = require("axios");

module.exports = {
  command: ["fb", "facebook"],
  description: "Descarga videos de Facebook.",
  categoria: "descarga",
  use: "https://www.facebook.com/share/r/15kXJEJXPA/",
  run: async (client, m, args) => {
    if (!args[0]) {
      return client.reply(
        m.chat,
        "Ingrese un enlace de *Facebook*\n\n`Ejemplo`\n!fb https://www.facebook.com/share/r/15kXJEJXPA/",
        m,
        global.channelInfo
      );
    }

    if (!args[0].match(/facebook\.com|fb\.watch|video\.fb\.com/)) {
      return client.reply(
        m.chat,
        "El enlace no parece *válido*. Asegúrate de que sea de *Facebook*",
        m,
        global.channelInfo
      );
    }

    await client.reply(
      m.chat,
      "⏳ Procesando video de Facebook...\n🤖 SonGokuBot",
      m,
      global.channelInfo
    );

    try {
      const api = `https://apis-starlights-team.koyeb.app/starlight/facebook?url=${encodeURIComponent(args[0])}`;
      const { data } = await axios.get(api);

      if (!data || data.status === false) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener el video",
          m,
          global.channelInfo
        );
      }

      const caption = `
📥 *FACEBOOK DOWNLOADER*

🎬 *Título:* ${data.title}
👤 *Autor:* ${data.creator}
⏱ *Duración:* ${(data.duration_ms / 1000).toFixed(0)}s
      `.trim();

      // Miniatura
      await client.sendMessage(
        m.chat,
        {
          image: { url: data.thumbnail },
          caption,
        },
        { quoted: m, ...global.channelInfo }
      );

      // 🔥 HD = documento (más pesado)
      if (data.hd) {
        await client.sendMessage(
          m.chat,
          {
            document: { url: data.hd },
            mimetype: "video/mp4",
            fileName: "facebook_hd.mp4",
            caption: "📄 Video HD enviado como documento",
          },
          { quoted: m, ...global.channelInfo }
        );
      } else {
        // 🎥 SD = video normal
        await client.sendMessage(
          m.chat,
          {
            video: { url: data.sd },
            mimetype: "video/mp4",
            fileName: "facebook.mp4",
          },
          { quoted: m, ...global.channelInfo }
        );
      }

    } catch (e) {
      console.error("FB ERROR:", e?.response?.status || e.message);
      await client.reply(
        m.chat,
        "❌ Facebook bloqueó la descarga en este momento\nIntenta nuevamente más tarde",
        m,
        global.channelInfo
      );
    }
  },
};