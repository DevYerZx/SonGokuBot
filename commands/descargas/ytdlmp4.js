const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getMp4Url(videoUrl) {
  const res = await axios.get(
    `${API_URL}?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );

  if (!res.data?.status || !res.data?.result?.mp4) {
    throw new Error("API inválida");
  }

  return {
    mp4: res.data.result.mp4,
    title: res.data.result.title
  };
}

module.exports = {
  command: ["ytdlmp4"],
  categoria: "descarga",
  description: "Descarga video de YouTube",

  run: async (client, m, args) => {
    const userId = m.sender;
    let rawMp4, finalMp4;

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const wait = cooldowns.get(userId) - Date.now();
      if (wait > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(wait / 1000)}s*`,
          m,
          global.channelInfo
        );
      }
    }
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ Escribe el nombre del video",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");
      let videoUrl;
      let title = "video";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔍 Buscar en YouTube
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ No se encontró el video",
            m,
            global.channelInfo
          );
        }

        videoUrl = search.videos[0].url;
        title = search.videos[0].title
          .replace(/[\\/:*?"<>|]/g, "")
          .slice(0, 60);
      } else {
        videoUrl = query;
      }

      // 🔔 NOTIFICACIÓN
      await client.reply(
        m.chat,
`🎬 *VIDEO*
📹 ${title}
⏳ Descargando…`,
        m,
        global.channelInfo
      );

      rawMp4 = path.join(tmpDir, `${Date.now()}_raw.mp4`);
      finalMp4 = path.join(tmpDir, `${Date.now()}_final.mp4`);

      // ⬇️ Descargar MP4 (reintentos)
      let ok = false;
      for (let i = 0; i < 3; i++) {
        try {
          const { mp4 } = await getMp4Url(videoUrl);

          const res = await axios.get(mp4, {
            responseType: "stream",
            timeout: 60000,
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const writer = fs.createWriteStream(rawMp4);
          res.data.pipe(writer);

          await new Promise((r, e) => {
            writer.on("finish", r);
            writer.on("error", e);
          });

          if (fs.statSync(rawMp4).size < 300000) {
            throw new Error("Archivo incompleto");
          }

          ok = true;
          break;
        } catch {
          await sleep(1200);
        }
      }

      if (!ok) throw new Error("Fallo descarga");

      // 🎞️ Normalizar MP4 (opcional pero seguro)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp4}" -map 0:v -map 0:a? -c:v copy -c:a copy "${finalMp4}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 ENVIAR VIDEO (SIN TEXTO)
      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(finalMp4),
          mimetype: "video/mp4"
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTDL VIDEO ERROR:", err.message);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        "❌ Error al procesar el video",
        m,
        global.channelInfo
      );
    } finally {
      if (rawMp4 && fs.existsSync(rawMp4)) fs.unlinkSync(rawMp4);
      if (finalMp4 && fs.existsSync(finalMp4)) fs.unlinkSync(finalMp4);
    }
  }
};