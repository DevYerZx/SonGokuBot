const axios = require("axios");

module.exports = {
  command: ["lyrics", "letra"],
  categoria: "busqueda",
  run: async (client, m) => {
    try {
      const args = m.body.trim().split(/ +/).slice(1);
      if (!args.length) return m.reply("❌ Ingresa el nombre de la canción o artista para buscar la letra.");

      const query = encodeURIComponent(args.join(" "));
      const url = `https://gawrgura-api.onrender.com/search/lyrics?q=${query}`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data.status || !data.result) {
        return m.reply("❌ No se encontró la letra para esa búsqueda.");
      }

      const lyrics = data.result.lyrics || data.result.text || data.result; // dependiendo de la estructura

      if (!lyrics || lyrics.length === 0) {
        return m.reply("❌ Letra no disponible para esa canción.");
      }

      // Si la letra es demasiado larga se puede partir o mandar solo un fragmento
      const maxLength = 1500;
      const textReply = lyrics.length > maxLength
        ? lyrics.substring(0, maxLength) + "\n\n...(continúa)"
        : lyrics;

      m.reply(`🎶 Letra de: ${args.join(" ")}\n\n${textReply}`);
    } catch (err) {
      console.error(err);
      m.reply("⚠️ Ocurrió un error al buscar la letra.");
    }
  }
};