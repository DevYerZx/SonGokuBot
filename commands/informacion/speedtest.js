const speedTest = require("speedtest-net");

module.exports = {
  command: ["speedtest", "internet"],
  categoria: "informacion",
  description: "Mide la velocidad de internet del bot",

  run: async (client, m, args) => {
    try {
      await client.reply(
        m.chat,
        "⏳ Probando velocidad de internet... Esto puede tardar unos segundos",
        m,
        global.channelInfo
      );

      const test = speedTest({ acceptLicense: true, acceptGdpr: true });

      test.on('data', async data => {
        const resultMsg =
          `╭━━〔 🌐 SPEEDTEST 〕━━╮\n` +
          `┃ Latencia (Ping): ${data.ping.latency} ms\n` +
          `┃ Velocidad Descarga: ${(data.download.bandwidth / 125000).toFixed(2)} Mbps\n` +
          `┃ Velocidad Subida: ${(data.upload.bandwidth / 125000).toFixed(2)} Mbps\n` +
          `┃ Servidor: ${data.server.name}, ${data.server.location}\n` +
          `╰━━━━━━━━━━━━━━╯\n` +
          `🤖 ${global.namebot}`;

        await client.reply(m.chat, resultMsg, m, global.channelInfo);
      });

      test.on('error', async err => {
        console.error("SPEEDTEST ERROR:", err);
        await client.reply(
          m.chat,
          "❌ Error al medir la velocidad de internet",
          m,
          global.channelInfo
        );
      });

    } catch (err) {
      console.error("SPEEDTEST ERROR:", err);
      client.reply(
        m.chat,
        "❌ Error al medir la velocidad de internet",
        m,
        global.channelInfo
      );
    }
  }
};
