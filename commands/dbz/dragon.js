const {
  ensureUserData,
  formatReward,
  formatTimeMs,
  searchDragonBall,
  summonShenlong,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["buscarbola", "misbolas", "invocarshenlong"],
  categoria: "dbz",
  description: "Gestiona las esferas del dragon",

  run: async (client, m, args, context = {}) => {
    try {
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");
      const used = String(context.command || "misbolas").toLowerCase();

      if (used === "misbolas") {
        const text =
          `Esferas reunidas: ${user.dragonBalls.length}/7\n` +
          `${user.dragonBalls.length ? user.dragonBalls.join(", ") : "Todavia no tienes ninguna."}\n\n` +
          `Usa .buscarbola para seguir buscando.`;
        return client.reply(m.chat, text, m, global.channelInfo);
      }

      if (used === "buscarbola") {
        const result = searchDragonBall(user);
        if (!result.ok && result.cooldown) {
          return client.reply(
            m.chat,
            `Aun no detectas otra esfera. Espera ${formatTimeMs(result.cooldown * 1000)}.`,
            m,
            global.channelInfo,
          );
        }
        if (!result.ok && result.complete) {
          return client.reply(
            m.chat,
            `Ya tienes las 7 esferas. Usa .invocarshenlong zeni|poder|semillas|nivel`,
            m,
            global.channelInfo,
          );
        }
        if (!result.ok) {
          return client.reply(
            m.chat,
            `No encontraste ninguna esfera esta vez.${result.usedRadar ? " El radar se consumio." : ""}`,
            m,
            global.channelInfo,
          );
        }

        return client.reply(
          m.chat,
          `Encontraste la esfera ${result.ball}.${result.usedRadar ? " El radar ayudo." : ""}\nAhora tienes ${result.total}/7.`,
          m,
          global.channelInfo,
        );
      }

      const wish = String(args[0] || "").trim().toLowerCase();
      const result = summonShenlong(user, wish);

      if (!result.ok && result.cooldown) {
        return client.reply(
          m.chat,
          `Shenlong aun no responde. Espera ${formatTimeMs(result.cooldown * 1000)}.`,
          m,
          global.channelInfo,
        );
      }
      if (!result.ok && result.needBalls) {
        return client.reply(
          m.chat,
          "Necesitas las 7 esferas para invocar a Shenlong.",
          m,
          global.channelInfo,
        );
      }
      if (!result.ok && result.invalid) {
        return client.reply(
          m.chat,
          `Deseos disponibles: ${result.wishes.join(", ")}`,
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Shenlong concedio tu deseo de ${result.wish.label}.\nRecompensa: ${formatReward(result.result)}`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("DRAGON DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude gestionar las esferas."), m, global.channelInfo);
    }
  },
};
