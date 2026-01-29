const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getAudioUrl(videoUrl) {
  const res = await axios.get(
    `${API_URL}?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );
  if (!res.data?.result?.mp3) throw new Error("API inválida");
  return res.data.result.mp3;
}

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Descarga audio de YouTube y lo envía como nota de voz",

  run: async (client, m, args) => {
    const userId = m.sender;
    let rawFile, finalFile;

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const wait = cooldowns.get(userId) - Date.now();
      if (wait > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(wait / 1000)}s*`,
          m
        );
      }
    }
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ Usa: *ytvoz nombre o link de YouTube*",
          m
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔍 Buscar si no es link
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          cooldowns.delete(userId);
          return client.reply(m.chat, "❌ Video no encontrado", m);
        }
        videoUrl = search.videos[0].url;
        title = search.videos[0].title
          .replace(/[\\/:*?"<>|]/g, "")
          .slice(0, 60);
      }

      await client.reply(
        m.chat,
`🎙️ *NOTA DE VOZ*
🎵 ${title}
⏳ Procesando…`,
        m
      );

      rawFile = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalFile = path.join(tmpDir, `${Date.now()}_voice.opus`);

      // ⬇️ Descargar audio
      const audioUrl = await getAudioUrl(videoUrl);
      const res = await axios.get(audioUrl, {
        responseType: "stream",
        timeout: 60000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const writer = fs.createWriteStream(rawFile);
      res.data.pipe(writer);
      await new Promise((r, e) => {
        writer.on("finish", r);
        writer.on("error", e);
      });

      if (fs.statSync(rawFile).size < 100000) {
        throw new Error("Audio incompleto");
      }

      // 🎚️ Convertir a NOTA DE VOZ (opus)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawFile}" -vn -ac 1 -ar 48000 -c:a libopus -b:a 64k "${finalFile}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 Enviar como NOTA DE VOZ
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(finalFile),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("YTVoz ERROR:", err.message);
      cooldowns.delete(userId);
      await client.reply(
        m.chat,
        "❌ Error al procesar la nota de voz",
        m
      );
    } finally {
      if (rawFile && fs.existsSync(rawFile)) fs.unlinkSync(rawFile);
      if (finalFile && fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
    }
  }
};