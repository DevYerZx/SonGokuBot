const axios = require("axios");

module.exports = {
  command: ["korea", "coreana", "koreana"],
  categoria: "random",
  description: "Envía una imagen random estilo Korea 🇰🇷",

  run: async (client, m, args) => {
    try {
      // ⏳ Mensaje de espera
      await client.sendMessage(m.chat, {
        text: "🇰🇷 Buscando una imagen Korea, espera un momento..."
      }, { quoted: m });

      // 🌐 Llamada a la API
      const res = await axios.get(
        "https://api.soymaycol.icu/korea?apikey=may-3697c22b"
      );

      if (!res.data || !res.data.status) {
        return client.sendMessage(m.chat, {
          text: "❌ No se pudo obtener la imagen."
        }, { quoted: m });
      }

      const img = res.data.url;
      const user = res.data.user;

      // 🖼️ Enviar imagen con info channel
      await client.sendMessage(m.chat, {
        image: { url: img },
        caption: `🇰🇷 *KOREA RANDOM*

👤 Usuario API: *${user.username}*
📊 Requests hoy: *${user.requests_made_today}/${user.limit}*

✨ Disfruta la imagen 💖`,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: "🇰🇷 Korea Random",
            body: "Imágenes random estilo Korea",
            mediaType: 1,
            previewType: 0,
            renderLargerThumbnail: true,
            thumbnailUrl: img,
            sourceUrl: img
          }
        }
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await client.sendMessage(m.chat, {
        text: "❌ Error al conectar con la API Korea."
      }, { quoted: m });
    }
  }
};
