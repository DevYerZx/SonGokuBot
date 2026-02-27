const axios = require("axios");

module.exports = {
  command: ["githubstalk", "ghstalk"],
  categoria: "stalkear",
  description: "Stalkear un perfil público de GitHub",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply(
          "❌ Debes escribir un usuario de GitHub.\n\nEjemplo:\n.ghstalk DevYerZx"
        );
      }

      const user = encodeURIComponent(args[0]);
      const apiKey = "dvyer";

      const url = `https://api-adonix.ultraplus.click/stalk/github?apikey=${apiKey}&user=${user}`;
      const res = await axios.get(url);

      if (!res.data || !res.data.status) {
        return m.reply("❌ No se pudo obtener información del usuario.");
      }

      const d = res.data.result;

      const text = `
🐙 *GitHub Stalk*

👤 *Usuario:* ${d.login}
📝 *Nombre:* ${d.name || "No disponible"}
📄 *Bio:* ${d.bio || "Sin bio"}

📦 *Repos Públicos:* ${d.public_repos}
📄 *Gists Públicos:* ${d.public_gists}
👥 *Seguidores:* ${d.followers}
➡️ *Siguiendo:* ${d.following}

📅 *Cuenta creada:* ${new Date(d.created_at).toLocaleDateString()}
🔄 *Última actualización:* ${new Date(d.updated_at).toLocaleDateString()}

🔗 *Perfil:* ${d.html_url}
`;

      await client.sendMessage(
        m.chat,
        {
          image: { url: d.avatar_url },
          caption: text,
        },
        { quoted: m }
      );
    } catch (e) {
      console.log("GITHUB STALK ERROR:", e);
      m.reply("⚠️ Error al obtener datos de GitHub.");
    }
  },
};
