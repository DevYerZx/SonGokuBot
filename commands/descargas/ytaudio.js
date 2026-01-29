const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getMp3Url(videoUrl) {
  const res = await axios.get(
    `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );
  if (!res.data?.result) throw new Error("API inválida");
  return res.data.result;
}

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Descarga audio de YouTube en MP3",

  run: async (client, m, args) => {
    const userId = m.sender;
    let rawMp3, finalMp3;

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const remaining = cooldowns.get(userId) - Date.now();
      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)}s* antes de volver a usar el comando.`,
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
          "❌ *Ingresa un nombre o enlace de YouTube.*",
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
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ *No se encontraron resultados.*",
            m,
            global.channelInfo
          );
        }
        const v = search.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 70);
      }

      // 🎨 MENSAJE DE PROCESO
      await client.reply(
        m.chat,
`╭────── 🎧 YT AUDIO ──────╮
│ 🎵 ${title}
│ ⏳ Descargando y convirtiendo
│ ⚡ MP3 optimizado
│ 🤖 ${BOT_NAME}
╰────────────────────────╯`,
        m,
        global.channelInfo
      );

      rawMp3 = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`);

      let success = false;
      let lastErr;

      // 🔁 Retry (links expiran)
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

          success = true;
          break;
        } catch (e) {
          lastErr = e;
          await sleep(1200);
        }
      }

      if (!success) throw lastErr;

      // ⚡ FFmpeg optimizado para MP3
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp3}" -vn -ac 2 -ar 44100 -b:a 96k "${finalMp3}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 ENVIAR MP3 NORMAL
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(finalMp3),
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          caption:
`╭────── 🎶 AUDIO LISTO ──────╮
│ 🎵 ${title}
│ 📦 MP3 · 96kbps
│ ⚡ Alta compatibilidad
│ 🤖 ${BOT_NAME}
╰───────────────────────────╯`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTAUDIO ERROR:", err.message);
      cooldowns.delete(userId);
      await client.reply(
        m.chat,
`╭────── ❌ ERROR ──────╮
│ No se pudo descargar el audio
│ 🔁 Intenta con otro video
│ 🤖 ${BOT_NAME}
╰─────────────────────╯`,
        m,
        global.channelInfo
      );
    } finally {
      if (rawMp3 && fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3);
      if (finalMp3 && fs.existsSync(finalMp3)) fs.unlinkSync(finalMp3);
    }
  }
};