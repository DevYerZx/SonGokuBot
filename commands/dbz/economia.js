const {
  SHOP_ITEMS,
  buyItem,
  claimMission,
  ensureMissionForUser,
  ensureUserData,
  formatReward,
} = require("../../lib/dbzSystem");

module.exports = {
  command: ["zeni", "shop", "comprar", "mision", "misiones"],
  categoria: "dbz",
  description: "Economia, inventario y misiones DBZ",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "zeni").toLowerCase();
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");

      if (used === "zeni") {
        return client.reply(
          m.chat,
          `Zeni: ${user.zeni}\nInventario: senzu ${user.inventory.senzu} | radar ${user.inventory.radar} | armor ${user.inventory.armor} | capsule ${user.inventory.capsule}`,
          m,
          global.channelInfo,
        );
      }

      if (used === "shop") {
        const lines = Object.values(SHOP_ITEMS).map(
          (item) => `- ${item.key}: ${item.price} zeni | ${item.description}`,
        );
        return client.reply(
          m.chat,
          `SHOP DBZ\n\n${lines.join("\n")}\n\nUso: .comprar senzu 2`,
          m,
          global.channelInfo,
        );
      }

      if (used === "comprar") {
        const itemKey = String(args[0] || "").trim().toLowerCase();
        const quantity = Number(args[1] || 1);
        if (!itemKey) {
          return client.reply(
            m.chat,
            "Uso: .comprar <item> <cantidad>",
            m,
            global.channelInfo,
          );
        }

        const result = buyItem(user, itemKey, quantity);
        return client.reply(
          m.chat,
          `Compraste ${result.amount} ${result.item.name} por ${result.total} zeni.`,
          m,
          global.channelInfo,
        );
      }

      const mission = ensureMissionForUser(user);
      if (String(args[0] || "").trim().toLowerCase() === "reclamar") {
        const claim = claimMission(user);
        if (!claim.ok) {
          return client.reply(m.chat, claim.message, m, global.channelInfo);
        }

        return client.reply(
          m.chat,
          `Mision reclamada.\nRecompensa: ${formatReward(claim.reward)}${claim.leveledUp ? `\nSubiste ${claim.leveledUp} nivel(es).` : ""}`,
          m,
          global.channelInfo,
        );
      }

      return client.reply(
        m.chat,
        `Mision diaria:\n${mission.title}\nProgreso: ${mission.progress}/${mission.target}\nRecompensa: ${formatReward(mission.reward)}\n\nUsa .mision reclamar cuando la completes.`,
        m,
        global.channelInfo,
      );
    } catch (error) {
      console.error("ECONOMIA DBZ ERROR:", error);
      await client.reply(m.chat, String(error.message || "No pude abrir la economia DBZ."), m, global.channelInfo);
    }
  },
};
