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

      // Crear carpeta tmp si no existe
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      // Si no es URL, buscar con yt-search
      if (!/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/.test(query)) {
        const search = await yts(query);
        if (!search.videos || !search.videos.length) {
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados en YouTube.",
            m,
            global.channelInfo
          );
        }
        const v = search.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 100);
      } else {
        title = query.split("v=")[1].slice(0, 50);
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Descargar desde Gawrgura
      const apiRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
      );

      if (!apiRes.data?.status || !apiRes.data?.result) {
        return client.reply(
          m.chat,
          "❌ Error al obtener el audio desde la API.",
          m,
          global.channelInfo
        );
      }

      const audioUrl = apiRes.data.result;
      const tempMp3 = path.join(tmpDir, `${Date.now()}.mp3`);
      const finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`);

      const audioData = await axios.get(audioUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(tempMp3, Buffer.from(audioData.data));

      // Reencapsular con ffmpeg
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${tempMp3}" -codec:a libmp3lame -qscale:a 2 "${finalMp3}"`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Enviar audio con nombre
      await client.sendMessage(
        m.chat,
        {
          audio: { url: finalMp3 },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

      // Limpiar archivos temporales
      fs.unlinkSync(tempMp3);
      fs.unlinkSync(finalMp3);

    } catch (err) {
      console.error("YTAUDIO ERROR:", err.response?.data || err.message || err);
      client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el audio.",
        m,
        global.channelInfo
      );
    }
  }
};

