const {
  createTournament,
  ensureChatData,
  getTournament,
  joinTournament,
  leaveTournament,
  runTournament,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["torneodbz", "torneo"],
  categoria: "dbz",
  isGroup: true,
  description: "Torneo del poder entre usuarios del grupo",

  run: async (client, m, args) => {
    try {
      const chatData = ensureChatData(m.chat);
      const action = String(args[0] || "estado").trim().toLowerCase();

      if (action === "crear") {
        const tournament = createTournament(chatData, m.sender);
        return client.reply(
          m.chat,
          `Torneo del Poder creado.\nParticipantes: ${tournament.participants.length}\nUsen .torneodbz unir y luego .torneodbz iniciar`,
          m,
          global.channelInfo,
        );
      }

      if (action === "unir") {
        const tournament = joinTournament(chatData, m.sender);
        return client.reply(
          m.chat,
          `Te uniste al torneo.\nParticipantes actuales: ${tournament.participants.length}`,
          m,
          global.channelInfo,
        );
      }

      if (action === "salir") {
        const tournament = leaveTournament(chatData, m.sender);
        return client.reply(
          m.chat,
          tournament
            ? `Saliste del torneo.\nQuedan ${tournament.participants.length} participantes.`
            : "El torneo quedo vacio y se cancelo.",
          m,
          global.channelInfo,
        );
      }

      if (action === "iniciar") {
        const result = runTournament(chatData);
        const rounds = result.rounds
          .map((lines, index) => `Ronda ${index + 1}:\n${lines.join("\n")}`)
          .join("\n\n");
        return client.sendMessage(
          m.chat,
          {
            text:
              `TORNEO DEL PODER\n\n${rounds}\n\nCampeon: @${result.championJid.split("@")[0]}\nPremio: ${result.reward.zeni} zeni y ${result.reward.exp} exp`,
            mentions: [result.championJid],
          },
          { quoted: m, ...global.channelInfo },
        );
      }

      if (action === "cancelar") {
        chatData.tournament = null;
        return client.reply(m.chat, "Torneo cancelado.", m, global.channelInfo);
      }

      const tournament = getTournament(chatData);
      if (!tournament) {
        return client.reply(
          m.chat,
          "No hay torneo activo. Usa .torneodbz crear",
          m,
          global.channelInfo,
        );
      }

      const list = tournament.participants.map((jid) => `- @${jid.split("@")[0]}`).join("\n");
      await client.sendMessage(
        m.chat,
        {
          text:
            `TORNEO DEL PODER\n\nEstado: ${tournament.status}\nParticipantes: ${tournament.participants.length}\n\n${list}`,
          mentions: tournament.participants,
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("TORNEO DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude gestionar el torneo."), m, global.channelInfo);
    }
  },
};
