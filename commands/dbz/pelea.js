const {
  createFusion,
  ensureUserData,
  formatTimeMs,
  resolveBattle,
} = require("../../lib/dbzSystem");

function getOpponentJid(m) {
  return m.mentionedJid?.[0] || null;
}

module.exports = {
  command: ["vs", "fusion"],
  categoria: "dbz",
  isGroup: true,
  description: "Peleas PvP y fusiones DBZ",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "vs").toLowerCase();
      const challenger = ensureUserData(m.sender, m.pushName || "Guerrero");
      const opponentJid = getOpponentJid(m);

      if (!opponentJid || opponentJid === m.sender) {
        return client.reply(
          m.chat,
          used === "fusion"
            ? "Menciona a otro usuario para fusionarte.\nEjemplo: .fusion @usuario"
            : "Menciona a otro usuario para pelear.\nEjemplo: .vs @usuario",
          m,
          global.channelInfo,
        );
      }

      const opponent = ensureUserData(opponentJid, "Guerrero Rival");

      if (used === "fusion") {
        const fusion = createFusion(challenger, opponent, m.sender, opponentJid);
        if (!fusion.ok) {
          return client.reply(
            m.chat,
            `La fusion aun esta en cooldown. Espera ${formatTimeMs(fusion.cooldown * 1000)}.`,
            m,
            global.channelInfo,
          );
        }

        return client.reply(
          m.chat,
          `Fusion completada: ${fusion.fusionName}\nDuracion: ${formatTimeMs(fusion.expiresAt - Date.now())}\nBoost: x${fusion.multiplier}`,
          m,
          global.channelInfo,
        );
      }

      const duel = resolveBattle(challenger, opponent);
      const winnerJid = duel.winnerUser === challenger ? m.sender : opponentJid;
      const loserJid = winnerJid === m.sender ? opponentJid : m.sender;
      const winnerName = duel.winnerProfile.name;
      const loserName = duel.loserProfile.name;

      const text =
        `COMBATE DBZ\n\n` +
        `Ganador: ${winnerName} (@${winnerJid.split("@")[0]})\n` +
        `Perdedor: ${loserName} (@${loserJid.split("@")[0]})\n` +
        `Premio: ${duel.prize} zeni\n` +
        `${winnerName} gano ${duel.expWin} exp\n` +
        `${loserName} gano ${duel.expLose} exp\n` +
        `${duel.winnerLevelUps ? `${winnerName} subio ${duel.winnerLevelUps} nivel(es)\n` : ""}` +
        `${duel.loserLevelUps ? `${loserName} subio ${duel.loserLevelUps} nivel(es)\n` : ""}` +
        `Marcador: ${duel.scoreA} vs ${duel.scoreB}`;

      await client.sendMessage(
        m.chat,
        {
          text,
          mentions: [m.sender, opponentJid],
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("PELEA DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude resolver la pelea."), m, global.channelInfo);
    }
  },
};
