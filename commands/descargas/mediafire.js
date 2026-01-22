const axios = require("axios");

module.exports = {
  command: ["mediafire", "mf"],
  categoria: "descarga",
  description: "Descarga archivos de MediaFire",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply(
          "❌ Envía un enlace de MediaFire.\n\nEjemplo:\n.mediafire https://www.mediafire.com/file/xxxx/file"
        );
      }

      // 🔑 API KEY DIRECTA EN EL COMANDO
      const API_KEY = "dvyer";

      const urlMf = encodeURIComponent(args[0]);
      const apiUrl = `https://api-adonix.ultraplus.click/download/mediafire?apikey=${API_KEY}&url=${urlMf}`;

      // 🔔 Aviso
      await m.reply("📥 Obteniendo información del archivo...\n⏳ Espera un momento");

      const res = await axios.get(apiUrl);

      if (!res.data || !res.data.status) {
        return m.reply("❌ No se pudo obtener el archivo.");
      }

      const file = res.data.result;

      const caption =
        `📁 *MediaFire Downloader*\n\n` +
        `📄 *Archivo:* ${file.filename}\n` +
        `📦 *Tamaño:* ${file.size}\n` +
        `📂 *Tipo:* ${file.filetype}\n` +
        `📅 *Subido:* ${file.uploaded}`;

      // ⚠️ WhatsApp límite (~100MB)
      if (file.size && file.size.includes("MB")) {
        const sizeMB = parseFloat(file.size);
        if (sizeMB > 99) {
          return client.sendMessage(
            m.chat,
            {
              text:
                caption +
                `\n\n⚠️ *El archivo es muy grande para WhatsApp.*\n\n🔗 *Descárgalo aquí:*\n${file.link}`
            },
            { quoted: m }
          );
        }
      }

      await client.sendMessage(
        m.chat,
        {
          document: { url: file.link },
          fileName: file.filename,
          mimetype: "application/octet-stream",
          caption: caption
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("MEDIAFIRE ERROR:", e);
      m.reply("⚠️ Error al procesar el enlace de MediaFire.");
    }
  }
};
