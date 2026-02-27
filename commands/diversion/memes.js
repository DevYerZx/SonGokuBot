const axios = require("axios");

module.exports = {
  command: ["meme", "memes"],
  categoria: "diversion",
  run: async (client, m) => {
    try {
      const res = await axios.get(
        "https://api.soymaycol.icu/chistesimg?apikey=may-3697c22b"
      );

      const data = res.data;

      if (!data.status || !data.result?.url)
        return m.reply("❌ No se pudo obtener un meme.");

      await client.sendMessage(m.chat, {
        image: { url: data.result.url },
        caption: "🤣 *Meme*"
      });
    } catch (e) {
      m.reply("⚠️ Error al obtener el meme.");
    }
  }
};