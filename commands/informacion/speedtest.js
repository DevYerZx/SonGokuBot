const https = require("https");

module.exports = {
  command: ["speedtest", "internet"],
  categoria: "informacion",
  description: "Mide la velocidad de internet del bot",

  run: async (client, m, args) => {
    try {
      await client.reply(
        m.chat,
        "⏳ Probando velocidad de internet...\nEsto puede tardar unos segundos",
        m,
        global.channelInfo
      );

      const url = "https://speed.hetzner.de/100MB.bin"; // archivo de prueba 100MB
      const startTime = Date.now();

      https.get(url, (res) => {
        let downloaded = 0;

        res.on("data", (chunk) => {
          downloaded += chunk.length;
        });

        res.on("end", async () => {
          const durationSec = (Date.now() - startTime) / 1000;
          const speedMbps = ((downloaded * 8) / (1024 * 1024)) / durationSec;

          const msg =
            `╭━━〔 🌐 SPEEDTEST 〕━━╮\n` +
            `┃ Velocidad aproximada de descarga: ${speedMbps.toFixed(2)} Mbps\n` +
            `┃ Ping estimado: ${durationSec.toFixed(2)} s\n` +
            `╰━━━━━━━━━━━━━━╯\n` +
            `🤖 ${global.namebot}`;

          await client.reply(m.chat, msg, m, global.channelInfo);
        });

      }).on("error", async (err) => {
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

