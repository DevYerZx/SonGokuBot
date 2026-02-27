const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_KEY = "dvyer";
const API_URL = "https://api-adonix.ultraplus.click/download/mediafire";
const MAX_MB = 300; // 🔒 LÍMITE 300 MB

module.exports = {
  command: ["mediafire", "mf"],
  categoria: "descarga",
  description: "Descarga archivos de MediaFire y los envía",

  run: async (client, m, args) => {
    let filePath;

    try {
      if (!args.length) {
        return m.reply(
          "❌ Ingresa un enlace de MediaFire.\n\nEjemplo:\n.mediafire https://www.mediafire.com/file/xxxxx/file",
          m,
          global.channelInfo
        );
      }

      await client.reply(
        m.chat,
        `📥 Descargando archivo...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      );

      const api = `${API_URL}?apikey=${API_KEY}&url=${encodeURIComponent(args[0])}`;
      const res = await axios.get(api, { timeout: 60000 });

      if (!res.data?.status) {
        throw new Error("API inválida");
      }

      const file = res.data.result;

      // 📦 Obtener tamaño real
      let sizeMB = 0;
      if (file.size?.includes("MB")) {
        sizeMB = parseFloat(file.size);
      } else if (file.size?.includes("GB")) {
        sizeMB = parseFloat(file.size) * 1024;
      }

      // 🚫 Si supera 300 MB → SOLO LINK
      if (sizeMB > MAX_MB) {
        return client.sendMessage(
          m.chat,
          {
            text:
              `📁 *MediaFire Downloader*\n\n` +
              `📄 *Archivo:* ${file.filename}\n` +
              `📦 *Tamaño:* ${file.size}\n` +
              `📂 *Tipo:* ${file.filetype}\n\n` +
              `⚠️ *El archivo supera el límite de 300MB*\n\n` +
              `🔗 Descárgalo manualmente:\n${file.link}`
          },
          { quoted: m, ...global.channelInfo }
        );
      }

      // 📂 Carpeta temporal
      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      const safeName = file.filename.replace(/[\\/:*?"<>|]/g, "");
      filePath = path.join(tmpDir, `${Date.now()}_${safeName}`);

      // ⬇️ DESCARGA REAL
      const fileRes = await axios.get(file.link, {
        responseType: "arraybuffer",
        timeout: 600000 // 10 min
      });

      fs.writeFileSync(filePath, fileRes.data);

      // 📤 ENVIAR A WHATSAPP
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          fileName: safeName,
          mimetype: "application/octet-stream",
          caption:
            `📁 *MediaFire Downloader*\n\n` +
            `📄 *Archivo:* ${file.filename}\n` +
            `📦 *Tamaño:* ${file.size}\n` +
            `📂 *Tipo:* ${file.filetype}\n\n` +
            `🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("MEDIAFIRE ERROR:", err);
      await client.reply(
        m.chat,
        "❌ Error al descargar el archivo de MediaFire.",
        m,
        global.channelInfo
      );
    } finally {
      // 🧹 LIMPIEZA
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};
