const {
  attackBoss,
  ensureBoss,
  ensureChatData,
  ensureUserData,
  getBoss,
  formatTimeMs,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["bossdbz", "golpear", "cargar", "curar"],
  categoria: "dbz",
  isGroup: true,
  description: "Sistema de bosses DBZ para grupos",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "bossdbz").toLowerCase();
      const chatData = ensureChatData(m.chat);
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");
      user.jid = m.sender;

      if (used === "bossdbz") {
        const boss = getBoss(chatData) || ensureBoss(chatData);
        return client.reply(
          m.chat,
          `BOSS DBZ\n\nNombre: ${boss.name}\nHP: ${boss.hp}/${boss.maxHp}\nTiempo: ${formatTimeMs(boss.expiresAt - Date.now())}\n\nUsa .golpear, .cargar o .curar`,
          m,
          global.channelInfo,
        );
      }

      const action = used === "golpear" ? "attack" : used === "cargar" ? "charge" : "heal";
      const result = attackBoss(user, chatData, action);

      if (!result.ok && result.needKi) {
        return client.reply(m.chat, "No tienes suficiente ki. Usa .cargar primero.", m, global.channelInfo);
      }
      if (!result.ok && result.needItem) {
        return client.reply(m.chat, "No tienes semillas del ermitao. Compra en .shop", m, global.channelInfo);
      }

      if (result.action === "charge") {
        return client.reply(
          m.chat,
          `Cargaste ${result.kiGain} de ki.\nBoss actual: ${result.boss.name} (${result.boss.hp}/${result.boss.maxHp} HP)`,
          m,
          global.channelInfo,
        );
      }

      if (result.action === "heal") {
        return client.reply(
          m.chat,
          `Usaste una semilla del ermitao y recuperaste salud y ki al maximo.`,
          m,
          global.channelInfo,
        );
      }

      if (result.finished) {
        const rewards = result.rewards
          .map((item) => `@${item.jid.split("@")[0]} +${item.zeni} zeni (+${item.exp} exp)`)
          .join("\n");
        return client.sendMessage(
          m.chat,
          {
            text:
              `Derrotaron al boss.\nDanio final: ${result.damage}\n\nRecompensas:\n${rewards}`,
            mentions: result.rewards.map((item) => item.jid),
          },
          { quoted: m, ...global.channelInfo },
        );
      }

      return client.reply(
        m.chat,
        `Golpeaste a ${result.boss.name} y causaste ${result.damage} de danio.\nHP restante: ${result.boss.hp}/${result.boss.maxHp}`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("BOSS DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude gestionar el boss."), m, global.channelInfo);
    }
  },
};
