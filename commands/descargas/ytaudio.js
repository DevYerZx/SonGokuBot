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

      const query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

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
        // si es URL, usarla y tomar título genérico
        title = query.split("v=")[1].slice(0, 50);
      }

      // Mensaje de búsqueda
      await client.reply(
        m.chat,
        `⏳ Descargando audio de YouTube...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Descargar desde API Gawrgura
      const apiRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { responseType: "arraybuffer", timeout: 120000 }
      );

      if (!apiRes.data?.status && !apiRes.data?.result) {
        return client.reply(
          m.chat,
          "❌ Error al descargar el audio desde la API.",
          m,
          global.channelInfo
        );
      }

      const audioUrl = apiRes.data.result;
      const tempMp3 = path.join(__dirname, `../../tmp/${Date.now()}.mp3`);
      const finalMp3 = path.join(__dirname, `../../tmp/${Date.now()}_final.mp3`);

      // Guardar archivo temporal
      const audioData = await axios.get(audioUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(tempMp3, Buffer.from(audioData.data));

      // Reencapsular con ffmpeg para WhatsApp
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${tempMp3}" -codec:a libmp3lame -qscale:a 2 "${finalMp3}"`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Enviar audio
      await client.sendMessage(
        m.chat,
        {
          audio: { url: finalMp3 },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

      // Borrar temporales
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

