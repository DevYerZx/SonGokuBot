const {
  ensureUserData,
  getProfileSummary,
  formatTimeMs,
} = require("../../lib/dbzSystem");
const { imageUrlToJpegBuffer } = require("../../lib/dragonBallApi");

module.exports = {
  command: ["perfil", "perfildbz", "power", "ki"],
  categoria: "dbz",
  description: "Muestra tu perfil DBZ o el de otro guerrero",

  run: async (client, m) => {
    try {
      const targetJid = m.mentionedJid?.[0] || m.sender;
      const pushName =
        targetJid === m.sender ? m.pushName || "Guerrero" : "Guerrero Z";
      const user = ensureUserData(targetJid, pushName);
      const profile = getProfileSummary(user);
      const mission = user.mission;
      const fusionLine = profile.fusion
        ? `${profile.fusion.name} (${formatTimeMs(profile.fusion.expiresAt - Date.now())})`
        : "Ninguna";

      const text =
        `PERFIL DBZ\n\n` +
        `Personaje fijo: ${profile.character ? `${profile.character.name} (#${profile.character.id})` : "sin elegir"}\n` +
        `Nombre: ${profile.name}\n` +
        `Raza: ${profile.race}\n` +
        `Nivel: ${profile.level} (${profile.exp}/${profile.maxExp} exp)\n` +
        `Transformacion: ${profile.transformation}\n` +
        `Poder base: ${profile.power}\n` +
        `Poder real: ${profile.effectivePower}\n` +
        `Ki: ${profile.ki}/${profile.maxKi}\n` +
        `Salud: ${profile.health}/${profile.maxHealth}\n` +
        `Zeni: ${profile.zeni}\n` +
        `Esferas: ${profile.dragonBalls.length ? profile.dragonBalls.join(", ") : "ninguna"}\n` +
        `Fusion: ${fusionLine}\n` +
        `Inventario: senzu ${profile.inventory.senzu} | radar ${profile.inventory.radar} | armor ${profile.inventory.armor} | capsule ${profile.inventory.capsule}\n` +
        `Victorias: ${profile.stats.wins} | Derrotas: ${profile.stats.losses}\n` +
        `Danio boss: ${profile.stats.bossDamage} | Trivias: ${profile.stats.triviaCorrect}\n` +
        `Mision: ${mission ? `${mission.title} (${mission.progress}/${mission.target})` : "usa .mision"}`;

      if (profile.character?.image) {
        const imageBuffer = await imageUrlToJpegBuffer(profile.character.image);
        return client.sendMessage(
          m.chat,
          {
            image: imageBuffer,
            caption: text,
          },
          {
            quoted: m,
            ...global.channelInfo,
          },
        );
      }

      await client.reply(m.chat, text, m, global.channelInfo);
    } catch (error) {
      console.error("PERFIL DBZ ERROR:", error);
      await client.reply(m.chat, "No pude mostrar el perfil DBZ.", m, global.channelInfo);
    }
  },
};
