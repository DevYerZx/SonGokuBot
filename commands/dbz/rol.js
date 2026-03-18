const { ATTACKS, QUOTES, randomItem } = require("../../lib/dbzSystem");

module.exports = {
  command: ["frasegoku", "ataque", "genkidama", "teletransportacion"],
  categoria: "dbz",
  description: "Rol y frases inspiradas en Dragon Ball",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "frasegoku").toLowerCase();

      if (used === "frasegoku") {
        return client.reply(
          m.chat,
          `Goku dice: "${randomItem(QUOTES)}"`,
          m,
          global.channelInfo,
        );
      }

      if (used === "genkidama") {
        return client.reply(
          m.chat,
          `${m.pushName || "Un guerrero"} levanta las manos y empieza a formar una Genkidama gigantesca.`,
          m,
          global.channelInfo,
        );
      }

      if (used === "teletransportacion") {
        const destination = args.join(" ").trim() || "el campo de batalla";
        return client.reply(
          m.chat,
          `${m.pushName || "El guerrero"} usa la teletransportacion instantanea hacia ${destination}.`,
          m,
          global.channelInfo,
        );
      }

      const attackKey = String(args[0] || "kamehameha").trim().toLowerCase().replace(/\s+/g, "");
      const effect = ATTACKS[attackKey];
      if (!effect) {
        return client.reply(
          m.chat,
          `Ataques disponibles: ${Object.keys(ATTACKS).join(", ")}`,
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `${m.pushName || "El guerrero"} ${effect}`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("ROL DBZ ERROR:", error);
      await client.reply(m.chat, "No pude hacer la accion DBZ.", m, global.channelInfo);
    }
  },
};
