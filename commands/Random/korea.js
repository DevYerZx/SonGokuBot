const axios = require("axios");

module.exports = {
  command: ["korea", "coreana", "koreana"],
  categoria: "random",
  description: "Envía una imagen random Korea 🇰🇷",

  run: async (client, m, args) => {
    try {
      await client.reply(
        m.chat,
        "🇰🇷 Enviando imagen Korea, espera un momento...",
        m,
        global.channelInfo
      );

      // 🌐 Llamada a la API
      const res = await axios.get(
        "https://api.soymaycol.icu/korea?apikey=may-3697c22b"
      );

      if (!res.data || !res.data.status) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener la imagen Korea.",
          m,
          global.channelInfo
        );
      }

      await client.sendMessage(
        m.chat,
        {
          image: { url: res.data.url },
          caption: "🇰🇷 *KOREA RANDOM*\n\n✨ Disfruta la imagen 💖",
        },
        {
          quoted: m,
          contextInfo: global.channelInfo
        }
      );

    } catch (err) {
      console.error(err);
      return client.reply(
        m.chat,
        "❌ Error al conectar con la API Korea.",
        m,
        global.channelInfo
      );
    }
  }
};

