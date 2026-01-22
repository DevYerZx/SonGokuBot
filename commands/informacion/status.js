const os = require("os");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["status", "estadisticas", "botinfo"],
  categoria: "informacion",
  description: "Muestra información del sistema y del bot",

  run: async (client, m, args) => {
    try {
      // 🔹 RAM
      const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
      const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
      const usedMemMB = (totalMemMB - freeMemMB).toFixed(2);

      // 🔹 CPU
      const cpus = os.cpus();
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;

      // 🔹 Uptime del bot
      const uptimeMin = (os.uptime() / 60).toFixed(2);

      // 🔹 Disco (solo raíz)
      let diskUsed = "N/A";
      let diskTotal = "N/A";
      try {
        const stat = fs.statSync("/");
        // Node nativo no da disco fácil; mejor solo indicar carpeta tmp
        const tmpPath = path.join(__dirname, "../../tmp");
        const files = fs.existsSync(tmpPath) ? fs.readdirSync(tmpPath) : [];
        diskUsed = files.length + " archivos temporales";
      } catch {}
      
      // 🔹 Mensaje completo
      const message = `
╭━━〔 🖥️ Estado del Bot 〕━━╮
┃ 🤖 Bot: ${global.namebot} v${global.version}
┃ 👤 Owner: ${global.owner.join(", ")}
┃
┃ 🕒 Uptime: ${uptimeMin} min
┃ 💻 CPU: ${cpuModel} | Cores: ${cpuCores}
┃ 🧠 RAM: ${usedMemMB} MB / ${totalMemMB} MB (Libre: ${freeMemMB} MB)
┃ 💾 Tmp: ${diskUsed}
╰━━━━━━━━━━━━━━━━━━━━╯
`;

      await client.reply(m.chat, message, m);

    } catch (err) {
      console.error("STATUS ERROR:", err);
      client.reply(m.chat, "❌ Ocurrió un error al obtener el estado del bot", m);
    }
  }
};
