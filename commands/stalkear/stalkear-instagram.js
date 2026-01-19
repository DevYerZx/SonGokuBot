const axios = require("axios");

module.exports = {
  command: ["instagramstalk", "igstalk"],
  categoria: "stalkear",
  description: "Stalkear un perfil público de Instagram",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply(
          "❌ Debes escribir un usuario de Instagram.\n\nEjemplo:\n.igstalk yer29_07"
        );
      }

      const user = encodeURIComponent(args[0]);
      const apiKey = "dvyer";

      const url = `https://api-adonix.ultraplus.click/stalk/instagram?apikey=${apiKey}&user=${user}`;
      const res = await axios.get(url);

      if (!res.data || !res.data.status) {
        return m.reply("❌ No se pudo obtener información del usuario.");
      }

      const ig = res.data.result;

      const caption = `
📸 *Instagram Stalk*

👤 *Usuario:* ${ig.username}
📝 *Nombre:* ${ig.full_name || "No disponible"}
📄 *Bio:* ${ig.bio || "Sin bio"}

👥 *Seguidores:* ${ig.followers}
➡️ *Siguiendo:* ${ig.following}
🖼️ *Publicaciones:* ${ig.posts}

🔒 *Privado:* ${ig.private ? "Sí" : "No"}
✅ *Verificado:* ${ig.verified ? "Sí" : "No"}
`;

      await client.sendMessage(
        m.chat,
        {
          image: { url: ig.profile_pic },
          caption: caption,
        },
        { quoted: m }
      );
    } catch (e) {
      console.log("IG STALK ERROR:", e);
      m.reply("⚠️ Error al obtener datos de Instagram.");
    }
  },
};
