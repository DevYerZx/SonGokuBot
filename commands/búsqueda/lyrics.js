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

      if (!data || !data.result)
        return m.reply("❌ No se encontró la letra.");

      const lyrics =
        data.result.lyrics ||
        data.result.text ||
        data.result;

      if (typeof lyrics !== "string" || !lyrics.length)
        return m.reply("❌ No se encontró la letra.");

      const maxLength = 1200;

      await m.reply(`🎶 *Letra de:* ${args.join(" ")}`);

      for (let i = 0; i < lyrics.length; i += maxLength) {
        await m.reply(lyrics.slice(i, i + maxLength));
      }

    } catch (e) {
      console.error(e);
      m.reply("⚠️ Error al buscar la letra.");
    }
  }
};