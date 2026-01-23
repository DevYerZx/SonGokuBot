const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://api-adonix.ultraplus.click/download/ytquality";
const API_KEY = "dvyer";

// ⏳ Cooldown
const cooldowns = new Map();
const COOLDOWN = 15 * 1000;

// 📦 Límite 300 MB
const MAX_MB = 300;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// 📊 Límite diario
const DAILY_LIMIT = 5;
const limits = new Map();

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function canUse(sender, botJid) {
  const clean = sender.replace(/@.+/, "");

  if (global.owner.includes(clean)) return true;
  if (sender === botJid) return true;

  const now = new Date();
  if (!limits.has(sender)) {
    limits.set(sender, { count: 1, date: now });
    return true;
  }

  const data = limits.get(sender);
  if (!sameDay(data.date, now)) {
    limits.set(sender, { count: 1, date: now });
    return true;
  }

  if (data.count >= DAILY_LIMIT) return false;
  data.count++;
  return true;
}

module.exports = {
 // command: ["ytquality", "ytq"],
//categoria: "descarga",
  description: "Descarga YouTube SOLO en 720p",

  run: async (client, m, args) => {
    let filePath;
    const user = m.sender;
    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";

    try {
      // 🔐 Límite diario
      if (!canUse(user, botJid)) {
        return client.reply(
          m.chat,
          `🚫 *Límite diario alcanzado*\n\n📊 Máx: *${DAILY_LIMIT} usos/día*\n👑 Owner y bot: ilimitado`,
          m,
          global.channelInfo
        );
      }

      // ⏳ Cooldown
      if (cooldowns.has(user)) {
        const t = cooldowns.get(user) - Date.now();
        if (t > 0) {
          return client.reply(
            m.chat,
            `⏳ Espera *${Math.ceil(t / 1000)} segundos*`,
            m,
            global.channelInfo
          );
        }
      }
      cooldowns.set(user, Date.now() + COOLDOWN);

      if (!args.length) {
        cooldowns.delete(user);
        return client.reply(
          m.chat,
          "❌ Uso:\n.ytquality <nombre o link>",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let url = query;
      let title = "youtube";

      // 🔎 Buscar si no es link
      if (!query.startsWith("http")) {
        const search = await yts(query);
        if (!search.videos.length) {
          cooldowns.delete(user);
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados",
            m,
            global.channelInfo
          );
        }
        url = search.videos[0].url;
        title = search.videos[0].title;
      }

      await client.reply(
        m.chat,
        `⏳ Descargando en *720p*\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 📡 API (FIJO 720p)
      const res = await axios.get(API_URL, {
        params: {
          url,
          type: "video",
          quality: "720p",
          apikey: API_KEY
        },
        timeout: 180000
      });

      if (!res.data?.url) throw "Respuesta inválida";

      const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 60);

      const tmp = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmp, { recursive: true });

      const media = await axios.get(res.data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      // 📦 Verificar tamaño
      const size = Buffer.byteLength(media.data);
      if (size > MAX_BYTES) {
        cooldowns.delete(user);
        return client.reply(
          m.chat,
          `📦 Tamaño: ${(size / 1024 / 1024).toFixed(2)} MB\n❌ Límite: ${MAX_MB} MB`,
          m,
          global.channelInfo
        );
      }

      filePath = path.join(tmp, `${Date.now()}_${user}.mp4`);
      fs.writeFileSync(filePath, media.data);

      // 📄 Enviar como documento
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎬 ${safeTitle}\n📺 Calidad: 720p\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
      console.error("YTQUALITY ERROR:", e);
      cooldowns.delete(user);
      await client.reply(
        m.chat,
        "❌ Error al descargar el video",
        m,
        global.channelInfo
      );
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
};
