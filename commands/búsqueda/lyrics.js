const axios = require("axios");

module.exports = {
  command: ["lyrics", "letra"],
  categoria: "busqueda",
  run: async (client, m) => {
    try {
      const args = m.body.trim().split(/ +/).slice(1);
      if (!args.length) return m.reply("❌ Ingresa el nombre de la canción o artista.");

      const query = encodeURIComponent(args.join(" "));
      const url = `https://gawrgura-api.onrender.com/search/lyrics?q=${query}`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data.status || !data.result || !data.result.lyrics)
        return m.reply("❌ No se encontró la letra.");

      const lyrics = data.result.lyrics;
      const maxLength = 1200;

      let parts = [];
      for (let i = 0; i < lyrics.length; i += maxLength) {
        parts.push(lyrics.substring(i, i + maxLength));
      }

      await m.reply(`🎶 *Letra de:* ${args.join(" ")}`);

      for (const part of parts) {
        await m.reply(part);
      }

    } catch (e) {
      console.error(e);
      m.reply("⚠️ Error al buscar la letra.");
    }
  }
};