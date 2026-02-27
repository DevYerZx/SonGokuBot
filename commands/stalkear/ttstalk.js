const axios = require("axios");

module.exports = {
  command: ["tiktokstalk", "ttstalk"],
  categoria: "stalkear",
  description: "Stalkear un perfil público de TikTok",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply(
          "❌ Debes escribir un usuario de TikTok.\n\nEjemplo:\n.ttstalk .spyderfx"
        );
      }

      const user = encodeURIComponent(args[0]);
      const apiKey = "dvyer";

      const url = `https://api-adonix.ultraplus.click/stalk/tiktok?apikey=${apiKey}&user=${user}`;
      const res = await axios.get(url);

      if (!res.data || !res.data.status) {
        return m.reply("❌ No se pudo obtener información del usuario.");
      }

      const data = res.data.result;
      const u = data.user;
      const s = data.stats;

      const caption = `
🎵 *TikTok Stalk*

👤 *Usuario:* ${u.uniqueId}
📝 *Nombre:* ${u.nickname}
📄 *Bio:* ${u.signature || "Sin bio"}

👥 *Seguidores:* ${s.followerCount}
➡️ *Siguiendo:* ${s.followingCount}
❤️ *Likes:* ${s.heartCount}
🎬 *Videos:* ${s.videoCount}

🔒 *Cuenta Privada:* ${u.privateAccount ? "Sí" : "No"}
✅ *Verificado:* ${u.verified ? "Sí" : "No"}
🌍 *Idioma:* ${u.language || "No disponible"}
`;

      await client.sendMessage(
        m.chat,
        {
          image: { url: u.avatarLarger || u.avatarThumb },
          caption: caption,
        },
        { quoted: m }
      );
    } catch (e) {
      console.log("TIKTOK STALK ERROR:", e);
      m.reply("⚠️ Error al obtener datos de TikTok.");
    }
  },
};
