const axios = require("axios");

module.exports = {
  command: ["gdrive", "drive"],
  categoria: "descarga",
  description: "Descarga archivos de Google Drive",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply(
          "❌ Debes enviar un enlace de Google Drive.\n\nEjemplo:\n.gdrive https://drive.google.com/file/d/XXXXX/view"
        );
      }

      const urlDrive = encodeURIComponent(args[0]);
      const apiUrl = `https://gawrgura-api.onrender.com/download/gdrive?url=${urlDrive}`;

      // 🔔 Aviso de descarga
      await m.reply("📥 Descargando archivo de Google Drive...\n⏳ Por favor espera");

      const res = await axios.get(apiUrl);

      if (!res.data || !res.data.status) {
        return m.reply("❌ No se pudo descargar el archivo.");
      }

      const file = res.data.result;

      let caption = `
📁 *Google Drive Downloader*

📄 *Archivo:* ${file.fileName}
📦 *Tamaño:* ${file.fileSize}
📎 *Tipo:* ${file.mimetype}
`;

      await client.sendMessage(
        m.chat,
        {
          document: { url: file.downloadUrl },
          mimetype: file.mimetype,
          fileName: file.fileName,
          caption: caption,
        },
        { quoted: m }
      );

    } catch (e) {
      console.log("GDRIVE ERROR:", e);
      m.reply("⚠️ Error al descargar el archivo de Drive.");
    }
  },
};
