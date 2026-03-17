const os = require("os");
const fs = require("fs");
const path = require("path");
const subbotManager = require("../../lib/subbotManager");

module.exports = {
  command: ["status", "estadisticas", "botinfo"],
  categoria: "informacion",
  description: "Muestra informacion del sistema y del bot",

  run: async (client, m) => {
    try {
      const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
      const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
      const usedMemMB = (totalMemMB - freeMemMB).toFixed(2);

      const cpus = os.cpus();
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;
      const uptimeMin = (os.uptime() / 60).toFixed(2);

      let diskUsed = "N/A";
      try {
        const tmpPath = path.join(__dirname, "../../tmp");
        const files = fs.existsSync(tmpPath) ? fs.readdirSync(tmpPath) : [];
        diskUsed = `${files.length} archivos temporales`;
      } catch {}

      const subbotStats = await subbotManager.getSubbotStats().catch(() => null);
      const subbotLine = subbotStats
        ? `┃ Subbots: ${subbotStats.total}/${subbotStats.maxLinks} | Activos: ${subbotStats.running} | Vinculados: ${subbotStats.linked}\n`
        : "";

      const message =
        `╭━━〔 Estado del Bot 〕━━╮\n` +
        `┃ Bot: ${global.namebot} v${global.version}\n` +
        `┃ Owner: ${global.owner.join(", ")}\n` +
        `┃\n` +
        `┃ Uptime: ${uptimeMin} min\n` +
        `┃ CPU: ${cpuModel} | Cores: ${cpuCores}\n` +
        `┃ RAM: ${usedMemMB} MB / ${totalMemMB} MB (Libre: ${freeMemMB} MB)\n` +
        `┃ Tmp: ${diskUsed}\n` +
        subbotLine +
        `╰━━━━━━━━━━━━━━━━━━━━╯`;

      await client.reply(m.chat, message, m);
    } catch (error) {
      console.error("STATUS ERROR:", error);
      client.reply(m.chat, "Ocurrio un error al obtener el estado del bot.", m);
    }
  },
};
