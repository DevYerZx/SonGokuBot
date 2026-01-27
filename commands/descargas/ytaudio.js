const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getMp3Url(videoUrl) {
  const res = await axios.get(
    `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );

  if (!res.data?.result) throw new Error("API inválida");
  return res.data.result;
}

module.exports = {
  command: ["ytaudio"],
  categoria: "descarga",
  description: "Descarga audio de YouTube y lo envía compatible con WhatsApp",

  run: async (client, m, args) => {
    let rawMp3, finalMp3;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Ingresa el nombre del video o link de YouTube.",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔎 Buscar si no es URL
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados.",
            m,
            global.channelInfo
          );
        }
        const v = search.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      rawMp3 = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`);

      let downloaded = false;
      let lastErr;

      // 🔁 Retry automático (links expiran)
      for (let i = 1; i <= 3; i++) {
        try {
          const mp3Url = await getMp3Url(videoUrl);

          const res = await axios.get(mp3Url, {
            responseType: "stream",
            timeout: 60000,
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const writer = fs.createWriteStream(rawMp3);
          res.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          if (fs.statSync(rawMp3).size < 120000) {
            throw new Error("Archivo incompleto");
          }

          downloaded = true;
          break;

        } catch (e) {
          lastErr = e;
          await sleep(1200);
        }
      }

      if (!downloaded) throw lastErr;

      // ⚡ FFmpeg optimizado para WhatsApp
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp3}" -vn -ac 2 -ar 44100 -acodec libmp3lame -b:a 96k "${finalMp3}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 Enviar audio
      await client.sendMessage(
        m.chat,
        {
          audio: { url: finalMp3 },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTAUDIO ERROR:", err.message);
      await client.reply(
        m.chat,
        "❌ No se pudo descargar el audio.\nIntenta con otro video.",
        m,
        global.channelInfo
      );
    } finally {
      if (rawMp3 && fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3);
      if (finalMp3 && fs.existsSync(finalMp3)) fs.unlinkSync(finalMp3);
    }
  }
};
