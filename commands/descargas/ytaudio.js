const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytmp3";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getMp3Url(videoUrl) {
  const res = await axios.get(
    `${API_URL}?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );
  if (!res.data?.result) throw new Error("API inválida");
  return res.data.result;
}

module.exports = {
  command: ["ytaudio"],
  categoria: "descarga",
  description: "Descarga audio MP3 de YouTube en buena calidad",

  run: async (client, m, args) => {
    const userId = m.sender;
    let rawMp3, finalMp3;

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
          "❌ Escribe un *nombre* o *link* de YouTube",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔍 Buscar si no es link
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
      }

      // 🎧 Mensaje corto
      await client.reply(
        m.chat,
`╭─🎧 YT MP3
│ 🎵 ${title}
│ ⏳ Procesando…
╰────────────`,
        m,
        global.channelInfo
      );

      rawMp3 = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`);

      // 🔁 Retry automático
      let ok = false, lastErr;
      for (let i = 0; i < 3; i++) {
        try {
          const mp3Url = await getMp3Url(videoUrl);
          const res = await axios.get(mp3Url, {
            responseType: "stream",
            timeout: 60000,
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const writer = fs.createWriteStream(rawMp3);
          res.data.pipe(writer);

          await new Promise((r, e) => {
            writer.on("finish", r);
            writer.on("error", e);
          });

          if (fs.statSync(rawMp3).size < 120000) {
            throw new Error("Archivo incompleto");
          }

          ok = true;
          break;
        } catch (e) {
          lastErr = e;
          await sleep(1200);
        }
      }

      if (!ok) throw lastErr;

      // 🎚️ MP3 128kbps REAL
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp3}" -vn -ac 2 -ar 44100 -b:a 128k "${finalMp3}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 Enviar MP3
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(finalMp3),
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          caption:
`╭─🎶 AUDIO MP3
│ 🎵 ${title}
│ 🎚️ 128kbps
│ 🤖 ${BOT_NAME}
╰────────────`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTA ERROR:", err.message);
      cooldowns.delete(userId);
      await client.reply(
        m.chat,
        "❌ Error al descargar el audio",
        m,
        global.channelInfo
      );
    } finally {
      if (rawMp3 && fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3);
      if (finalMp3 && fs.existsSync(finalMp3)) fs.unlinkSync(finalMp3);
    }
  }
};