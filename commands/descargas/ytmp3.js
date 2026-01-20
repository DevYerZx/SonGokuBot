const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y";

module.exports = {
  command: ["ytmp3"],
  categoria: "descarga",
  description: "Descarga el audio de YouTube en MP3 con imagen",

  run: async (client, m, args) => {
    let audioPath;

    try {
      if (!args.length)
        return m.reply(
          "❌ Debes colocar un enlace o nombre del video de YouTube.",
          m,
          global.channelInfo
        );

      let query = args.join(" ");
      let title = "audio";

      // Si no es link, buscar con yt-search
      if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
        const search = await yts(query);
        if (!search.videos.length)
          return m.reply("❌ No se encontraron resultados.", m, global.channelInfo);

        query = search.videos[0].url;
        title = search.videos[0].title || title;
      }

      await client.reply(
        m.chat,
        `🔊 Preparando tu audio...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      );

      // Llamar a la API
      const res = await axios.get(API_URL, { params: { url: query }, timeout: 120000 });
      const result = res.data?.result;

      if (!result?.url) throw new Error("No se obtuvo URL de descarga");

      const safeTitle = (result.info?.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 50);

      const thumbnailUrl = result.info?.thumbnail;

      // Crear carpeta temporal
      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      audioPath = path.join(tmpDir, `${Date.now()}.mp3`);

      // Descargar audio
      const audioData = await axios.get(result.url, { responseType: "arraybuffer", timeout: 300000 });
      fs.writeFileSync(audioPath, audioData.data);

      // Descargar miniatura si existe
      let thumbnailPath;
      if (thumbnailUrl) {
        const thumbRes = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
        thumbnailPath = path.join(tmpDir, `${Date.now()}_thumb.jpg`);
        fs.writeFileSync(thumbnailPath, thumbRes.data);
      }

      // Enviar audio con imagen
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(audioPath),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${safeTitle}.mp3`,
          caption: `🎵 *${safeTitle}*\n🤖 ${BOT_NAME}`,
          thumbnail: thumbnailPath ? fs.readFileSync(thumbnailPath) : undefined
        },
        { quoted: m, ...global.channelInfo }
      );

      // Borrar miniatura si se creó
      if (thumbnailPath && fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

    } catch (error) {
      console.error(error);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el audio.",
        m,
        global.channelInfo
      );
    } finally {
      if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }
  }
};