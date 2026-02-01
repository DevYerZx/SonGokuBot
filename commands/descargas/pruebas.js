const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["ttuser", "ttposts"],
  categoria: "descarga",
  description: "Descarga el último video de un usuario de TikTok",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply("📌 Usa así:\n`!ttuser @usuario`");
      }

      const user = args[0].startsWith("@") ? args[0] : `@${args[0]}`;
      m.reply(`🔍 Buscando videos de *${user}*...`);

      // 🔗 API
      const api = `https://apis-starlights-team.koyeb.app/starlight/tiktok-user-posts?user=${encodeURIComponent(user)}`;
      const { data } = await axios.get(api);

      if (!data.status || !data.result || data.result.length === 0) {
        return m.reply("❌ No se encontraron videos o la cuenta es privada.");
      }

      // 🎥 Tomar el video más reciente
      const video = data.result[0];
      const videoUrl =
        video.video?.downloadAddr ||
        video.video?.playAddr;

      if (!videoUrl) {
        return m.reply("⚠️ No se pudo obtener el enlace del video.");
      }

      const desc = video.desc || "Video de TikTok";
      const filePath = path.join(__dirname, `../../tmp/${Date.now()}.mp4`);

      // ⬇️ Descargar video
      const vid = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, vid.data);

      // 📤 Enviar video
      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(filePath),
          caption: `🎵 *${user}*\n\n${desc}`,
          mimetype: "video/mp4",
        },
        { quoted: m }
      );

      fs.unlinkSync(filePath);

    } catch (e) {
      console.error(e);
      m.reply("❌ Error al descargar el video de TikTok.");
    }
  }
};