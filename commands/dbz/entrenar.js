const {
  ensureUserData,
  trainUser,
  formatTimeMs,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["entrenar", "train", "meditar"],
  categoria: "dbz",
  description: "Entrena para subir tu poder",

  run: async (client, m) => {
    try {
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");
      const result = trainUser(user);

      if (!result.ok) {
        return client.reply(
          m.chat,
          `Aun estas entrenando. Vuelve en ${formatTimeMs(result.cooldown * 1000)}.`,
          m,
          global.channelInfo,
        );
      }

      const text =
        `ENTRENAMIENTO DBZ\n\n` +
        `+ Poder: ${result.powerGain}\n` +
        `+ Exp: ${result.expGain}\n` +
        `+ Zeni: ${result.zeniGain}\n` +
        `+ Ki: ${result.kiGain}\n` +
        `+ Salud: ${result.healthGain}\n` +
        (result.leveledUp ? `Subiste ${result.leveledUp} nivel(es).\n` : "") +
        `Tu nuevo poder base sigue creciendo.`;

      await client.reply(m.chat, text, m, global.channelInfo);
    } catch (error) {
      console.error("ENTRENAR DBZ ERROR:", error);
      await client.reply(m.chat, "No pude completar tu entrenamiento.", m, global.channelInfo);
    }
  },
};
