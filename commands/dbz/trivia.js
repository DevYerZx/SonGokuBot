const {
  answerTrivia,
  createTrivia,
  ensureChatData,
  ensureUserData,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["triviadbz", "adivinadbz", "dbzrespuesta"],
  categoria: "dbz",
  isGroup: true,
  description: "Trivia y adivinanzas de Dragon Ball",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "triviadbz").toLowerCase();
      const chatData = ensureChatData(m.chat);

      if (used === "triviadbz" || used === "adivinadbz") {
        const mode = used === "adivinadbz" ? "guess" : "trivia";
        const item = createTrivia(chatData, mode);
        if (item.mode === "trivia") {
          return client.reply(
            m.chat,
            `TRIVIA DBZ\n\n${item.question}\nA) ${item.options[0]}\nB) ${item.options[1]}\nC) ${item.options[2]}\nD) ${item.options[3]}\n\nResponde con .dbzrespuesta <texto o letra>`,
            m,
            global.channelInfo,
          );
        }

        return client.reply(
          m.chat,
          `${item.prompt}\n\nResponde con .dbzrespuesta <nombre>`,
          m,
          global.channelInfo,
        );
      }

      const user = ensureUserData(m.sender, m.pushName || "Guerrero");
      const response = answerTrivia(user, chatData, args.join(" "));

      if (!response.ok && response.expired) {
        return client.reply(m.chat, "No hay una trivia activa en este chat.", m, global.channelInfo);
      }
      if (!response.ok && response.empty) {
        return client.reply(m.chat, "Uso: .dbzrespuesta <respuesta>", m, global.channelInfo);
      }
      if (!response.ok) {
        return client.reply(m.chat, "Respuesta incorrecta. Intenta otra vez.", m, global.channelInfo);
      }

      await client.reply(
        m.chat,
        `Correcto.\nGanaste ${response.trivia.reward.zeni} zeni, ${response.trivia.reward.exp} exp y ${response.trivia.reward.power} poder.${response.leveledUp ? `\nSubiste ${response.leveledUp} nivel(es).` : ""}`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("TRIVIA DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude gestionar la trivia."), m, global.channelInfo);
    }
  },
};
