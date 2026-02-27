module.exports = {
  command: ["uptime"],
  categoria: "informacion",
  description: "Muestra el tiempo que lleva activo el bot",

  run: async (client, m, args) => {
    try {
      const totalSec = process.uptime(); // segundos
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = Math.floor(totalSec % 60);

      const uptimeMsg = 
        `╭━━〔 ⏱️ UPTIME 〕━━╮\n` +
        `┃ 🤖 Bot: ${global.namebot} v${global.version}\n` +
        `┃ 🕒 Activo desde: ${days} días, ${hours}h:${minutes}m:${seconds}s\n` +
        `╰━━━━━━━━━━━━━━╯\n` +
        `🤖 ${global.namebot}`;

      await client.reply(m.chat, uptimeMsg, m, global.channelInfo);

    } catch (err) {
      console.error("UPTIME ERROR:", err);
      client.reply(m.chat, "❌ Error al obtener el uptime", m, global.channelInfo);
    }
  }
};
