const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["applemusic", "am"],
  categoria: "descarga",
  description: "Descarga música de Apple Music",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply("🍎 *Usa así:*\n`!am <link de Apple Music>`");
      }

      const url = args[0];
      m.reply("⏳ Descargando desde Apple Music...");

      // 🔗 Petición a la API
      const api = `https://apis-starlights-team.koyeb.app/starlight/apple-music?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(api);

      if (!data.status) {
        return m.reply("❌ No se pudo obtener el audio.");
      }

      const info = data.result;
      const audioUrl = info.download;
      const title = info.title || "Apple Music";

      // 📂 Ruta del archivo
      const filePath = path.join(__dirname, `../../tmp/${Date.now()}.mp3`);

      // ⬇️ Descargar audio
      const audio = await axios.get(audioUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, audio.data);

      // 🎧 Enviar audio
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(filePath),
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
        },
        { quoted: m }
      );

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error(err);
      m.reply("⚠️ Error al descargar la canción.");
    }
  }
};