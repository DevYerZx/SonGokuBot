const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Descarga audio de YouTube y lo envía compatible con WhatsApp",

  run: async (client, m, args) => {
    let tempMp3;
    let finalMp3;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Ingresa el nombre del video o URL de YouTube.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔍 Buscar si no es URL
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados en YouTube.",
            m,
            global.channelInfo
          );
        }

        const v = search.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      } else {
        title = "audio_youtube";
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 🌐 NUEVA API YTMP3
      const apiRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!apiRes.data?.status || !apiRes.data.result) {
        throw new Error("API inválida");
      }

      const downloadUrl = apiRes.data.result;

      tempMp3 = path.join(tmpDir, `${Date.now()}.mp3`);
      finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`);

      // ⬇️ Descargar audio
      const audioData = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      fs.writeFileSync(tempMp3, audioData.data);

      // 🎚️ Convertir con FFmpeg (WhatsApp friendly)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${tempMp3}" -codec:a libmp3lame -qscale:a 2 "${finalMp3}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 Enviar audio
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(finalMp3),
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el audio.",
        m,
        global.channelInfo
      );
    } finally {
      if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
      if (finalMp3 && fs.existsSync(finalMp3)) fs.unlinkSync(finalMp3);
    }
  }
};
