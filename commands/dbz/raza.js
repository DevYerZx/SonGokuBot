const { RACES, ensureUserData, chooseRace } = require("../../lib/dbzSystem");

module.exports = {
  command: ["raza", "faccion", "clase"],
  categoria: "dbz",
  description: "Elige tu raza DBZ",

  run: async (client, m, args) => {
    try {
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");
      const raceKey = String(args[0] || "").trim().toLowerCase();

      if (!raceKey) {
        const lines = Object.values(RACES).map(
          (race) => `- ${race.key}: ${race.description}`,
        );
        return client.reply(
          m.chat,
          `Razas disponibles:\n${lines.join("\n")}\n\nUso: .raza saiyajin`,
          m,
          global.channelInfo,
        );
      }

      const race = chooseRace(user, raceKey);
      await client.reply(
        m.chat,
        `Ahora eres ${race.name}.\n${race.description}`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("RAZA DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude cambiar tu raza."), m, global.channelInfo);
    }
  },
};
