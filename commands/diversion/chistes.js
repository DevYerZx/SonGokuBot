const axios = require("axios");

module.exports = {
  command: ["chiste", "joke"],
  categoria: "diversion",
  run: async (client, m) => {
    try {
      const url = `https://api.soymaycol.icu/chistes?apikey=may-3697c22b`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data.status || !data.result || !data.result.chiste)
        return m.reply("❌ No se pudo obtener un chiste ahora, intenta luego.");

      const chiste = data.result.chiste;

      m.reply(`😂 *Chiste:*\n\n${chiste}`);
    } catch (e) {
      m.reply("⚠️ Ocurrió un error al obtener el chiste.");
    }
  }
};