const {
  ensureUserData,
  transformUser,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["transformar", "ssj", "transformacion"],
  categoria: "dbz",
  description: "Activa una transformacion DBZ",

  run: async (client, m, args) => {
    try {
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");
      const input = args.join(" ").trim();
      const result = transformUser(user, input);

      if (!result.changed) {
        const list = result.available
          .map((item) => `- ${item.key}: ${item.name} (lvl ${item.level})`)
          .join("\n");
        return client.reply(
          m.chat,
          `Transformacion actual: ${result.current.name}\n\nDisponibles:\n${list}\n\nUso: .transformar kaioken`,
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Transformacion activada: ${result.transformation.name}`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("TRANSFORMAR DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude transformarte."), m, global.channelInfo);
    }
  },
};
