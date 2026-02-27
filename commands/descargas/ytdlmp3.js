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

async function getMp3Url(videoUrl) {
  const res = await axios.get(
    `${API_URL}?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );

  if (!res.data?.status || !res.data?.result?.mp3) {
    throw new Error("API inválida");
  }

  return {
    mp3: res.data.result.mp3,
    title: res.data.result.title
  };
}

module.exports = {
  command: ["ytdlmp3"],
  categoria: "descarga",
  description: "Descarga música de YouTube como nota de voz",

  run: async (client, m, args) => {
    const userId = m.sender;
    let rawMp3, finalMp3, voiceOgg;

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
          "❌ Escribe el nombre de la canción",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");
      let videoUrl;
      let title = "audio";

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

      // 🔔 NOTIFICACIÓN (solo texto)
      await client.reply(
        m.chat,
`🖕 *Descargando*
🎵 ${title}
⏳ Procesando…`,
        m,
        global.channelInfo
      );

      rawMp3 = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`);
      voiceOgg = path.join(tmpDir, `${Date.now()}_voice.ogg`);

      // ⬇️ Descargar MP3 (reintentos)
      let ok = false;
      for (let i = 0; i < 3; i++) {
        try {
          const { mp3 } = await getMp3Url(videoUrl);

          const res = await axios.get(mp3, {
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
        } catch {
          await sleep(1200);
        }
      }

      if (!ok) throw new Error("Fallo descarga");

      // 🎚️ MP3 normalizado
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp3}" -vn -ac 2 -ar 44100 -b:a 128k "${finalMp3}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 🎙️ OGG OPUS (nota de voz)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${finalMp3}" -ac 1 -ar 48000 -c:a libopus -b:a 64k "${voiceOgg}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 ENVIAR AUDIO (SIN TEXTO)
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(voiceOgg),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTDL ERROR:", err.message);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        "❌ Error al procesar la nota de voz",
        m,
        global.channelInfo
      );
    } finally {
      if (rawMp3 && fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3);
      if (finalMp3 && fs.existsSync(finalMp3)) fs.unlinkSync(finalMp3);
      if (voiceOgg && fs.existsSync(voiceOgg)) fs.unlinkSync(voiceOgg);
    }
  }
};
