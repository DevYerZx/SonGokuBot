const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["ytm3", "ytaudio"],
  categoria: "descarga",
  description: "Descarga música de YouTube como MP3",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply("📌 Usa así:\n`!ytm3 <enlace o búsqueda>`");
      }

      let query = args.join(" ");

      // 🧠 Detectar si es link de YouTube
      const isUrl = /youtu/i.test(query);

      let videoUrl;

      if (isUrl) {
        // Si es URL
        videoUrl = query;
      } else {
        // ✨ YT SEARCH: buscar video
        m.reply(`🔎 Buscando en YouTube: *${query}*...`);
        const searchUrl = `https://apis-starlights-team.koyeb.app/starlight/yt-search?query=${encodeURIComponent(query)}`;
        const sr = await axios.get(searchUrl);
        const srdata = sr.data;

        if (!srdata.status || !srdata.result || !srdata.result[0]) {
          return m.reply("❌ No se encontró ningún video para esa búsqueda.");
        }

        // Tomar el primer resultado
        videoUrl = srdata.result[0].url;
      }

      m.reply("🎧 Obteniendo audio MP3...");

      // 🌐 API de descarga MP3
      const api = `https://apis-starlights-team.koyeb.app/starlight/youtube-mp3?url=${encodeURIComponent(videoUrl)}`;

      const { data } = await axios.get(api);

      if (!data.status || !data.result?.download) {
        return m.reply("❌ No se pudo descargar el MP3.");
      }

      const info = data.result;
      const downloadUrl = info.download;
      const title = info.title || "YouTube";

      // 🗂️ Guardar MP3
      const filePath = path.join(__dirname, `../../tmp/${Date.now()}.mp3`);
      const audio = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, audio.data);

      // 📲 Enviar audio
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
      m.reply("⚠️ Hubo un error al procesar tu petición.");
    }
  }
};