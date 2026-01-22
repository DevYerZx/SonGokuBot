const os = require("os");
const si = require("systeminformation"); // Para info avanzada de CPU, RAM, disco y red

module.exports = {
  command: ["status", "estadisticas", "botinfo"],
  categoria: "informacion",
  description: "Muestra información del sistema y del bot",

  run: async (client, m, args) => {
    try {
      // ✅ RAM
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      const usedMemMB = (usedMem / 1024 / 1024).toFixed(2);
      const freeMemMB = (freeMem / 1024 / 1024).toFixed(2);
      const totalMemMB = (totalMem / 1024 / 1024).toFixed(2);

      // ✅ CPU
      const cpuUsage = await si.currentLoad();
      const cpuInfo = await si.cpu();

      // ✅ Disco
      const disk = await si.fsSize();
      const diskUsed = (disk[0].used / 1024 / 1024 / 1024).toFixed(2);
      const diskTotal = (disk[0].size / 1024 / 1024 / 1024).toFixed(2);

      // ✅ Red (velocidad aproximada)
      const network = await si.networkStats();
      const netRxMB = (network[0].rx_bytes / 1024 / 1024).toFixed(2);
      const netTxMB = (network[0].tx_bytes / 1024 / 1024).toFixed(2);

      // ✅ Info general
      const uptime = (os.uptime() / 60).toFixed(2); // en minutos
      const platform = os.platform();
      const arch = os.arch();

      const message = `
╭━━〔 🖥️ Estado del Bot 〕━━╮
┃ 🤖 Bot: ${global.namebot} v${global.version}
┃ 👤 Owner: ${global.owner.join(", ")}
┃
┃ 🕒 Uptime: ${uptime} min
┃ 💻 Plataforma: ${platform} ${arch}
┃
┃ 🧠 RAM: ${usedMemMB} MB / ${totalMemMB} MB (Libre: ${freeMemMB} MB)
┃ 🖥️ CPU: ${cpuInfo.manufacturer} ${cpuInfo.brand}
┃ ⚡ Uso CPU: ${cpuUsage.currentLoad.toFixed(2)}%
┃
┃ 💾 Disco: ${diskUsed} GB / ${diskTotal} GB
┃
┃ 🌐 Red: RX ${netRxMB} MB | TX ${netTxMB} MB
╰━━━━━━━━━━━━━━━━━━━━╯
`;

      await client.reply(m.chat, message, m);

    } catch (err) {
      console.error("STATUS ERROR:", err);
      client.reply(m.chat, "❌ Ocurrió un error al obtener el estado del bot", m);
    }
  }
};
