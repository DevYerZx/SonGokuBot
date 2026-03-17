const { apiGet, normalizeApiUrl, pickApiDownloadUrl } = require("../../lib/dvyerApi");

const API_BASE = global.api?.baseUrl || "https://dv-yer-api.online";

module.exports = {
  command: ["fb", "facebook"],
  description: "Descarga videos de Facebook.",
  categoria: "descarga",
  use: "https://www.facebook.com/share/r/15kXJEJXPA/",

  run: async (client, m, args) => {
    try {
      const inputUrl = String(args[0] || "").trim();

      if (!inputUrl) {
        return client.reply(
          m.chat,
          "❌ Ingresa un enlace de Facebook\n\n📌 Ejemplo:\n!fb https://www.facebook.com/share/r/15kXJEJXPA/",
          m,
          global.channelInfo,
        );
      }

      if (!/facebook\.com|fb\.watch|video\.fb\.com/i.test(inputUrl)) {
        return client.reply(
          m.chat,
          "❌ El enlace no es valido. Asegurate de que sea de Facebook.",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        "⏳ Procesando video de Facebook...\n📥 Descargando, espera un momento\n🤖 SonGokuBot",
        m,
        global.channelInfo,
      );

      const data = await apiGet(`${API_BASE}/facebook`, {
        url: inputUrl,
        mode: "link",
        quality: "auto",
      });

      const videoUrl = normalizeApiUrl(pickApiDownloadUrl(data));

      if (!videoUrl) {
        return client.reply(
          m.chat,
          "❌ No se encontro un enlace de descarga valido.",
          m,
          global.channelInfo,
        );
      }

      const title = String(data?.title || data?.filename || "facebook").trim();
      const caption = `📘 FB DOWNLOADER\n\n🎬 ${title}\n🔗 ${inputUrl}\n🤖 SonGokuBot`;

      await client.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          caption,
          mimetype: "video/mp4",
          fileName: "facebook.mp4",
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("FB ERROR:", error);
      await client.reply(
        m.chat,
        String(error?.message || "❌ Error al procesar el video de Facebook."),
        m,
        global.channelInfo,
      );
    }
  },
};
