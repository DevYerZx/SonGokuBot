module.exports = {
  command: ["ping", "latencia"],
  categoria: "informacion",
  description: "Mide la latencia del bot",

  run: async (client, m, args) => {
    try {
      const start = Date.now();
      await client.reply(m.chat, "🏓 Ping...", m, global.channelInfo);
      const latency = Date.now() - start;

      const pingMsg =
        `╭━━〔 🏓 PING 〕━━╮\n` +
        `┃ Latencia: ${latency} ms\n` +
        `┃ Fecha: ${new Date().toLocaleString()}\n` +
        `╰━━━━━━━━━━━━╯\n` +
        `🤖 ${global.namebot}`;

      await client.reply(m.chat, pingMsg, m, global.channelInfo);

    } catch (err) {
      console.error("PING ERROR:", err);
      client.reply(m.chat, "❌ Error al medir la latencia", m, global.channelInfo);
    }
  }
};
