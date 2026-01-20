const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y";

module.exports = {
  command: ["ytmp3"],
  categoria: "descarga",
  description: "Descarga audio de YouTube y envía la miniatura",

  run: async (client, m, args) => {
    let audioPath, thumbnailPath;

    try {
      if (!args.length)
        return m.reply(
          "❌ Debes colocar un enlace o nombre del video de YouTube.",
          m,
          global.channelInfo
        );

      let query = args.join(" ");
      let title = "audio";

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

      const res = await axios.get(API_URL, { params: { url: query }, timeout: 120000 });
      const result = res.data?.result;

      if (!result?.url) throw new Error("No se obtuvo URL de descarga");

      const safeTitle = (result.info?.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 50);

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // Descargar audio
      audioPath = path.join(tmpDir, `${Date.now()}.mp3`);
      const audioData = await axios.get(result.url, { responseType: "arraybuffer", timeout: 300000 });
      fs.writeFileSync(audioPath, audioData.data);

      // Descargar miniatura
      if (result.info?.thumbnail) {
        const thumbRes = await axios.get(result.info.thumbnail, { responseType: "arraybuffer" });
        thumbnailPath = path.join(tmpDir, `${Date.now()}_thumb.jpg`);
        fs.writeFileSync(thumbnailPath, thumbRes.data);

        // Enviar la miniatura primero
        await client.sendMessage(
          m.chat,
          {
            image: fs.readFileSync(thumbnailPath),
            caption: `🎵 *${safeTitle}*\n🤖 ${BOT_NAME}`,
          },
          { quoted: m, ...global.channelInfo }
        );
      }

      // Enviar audio
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(audioPath),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${safeTitle}.mp3`,
        },
        { quoted: m, ...global.channelInfo }
      );

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
      if (thumbnailPath && fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    }
  }
};