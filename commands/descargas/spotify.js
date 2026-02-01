const axios = require("axios");

module.exports = {
  command: ["sp"],
  categoria: "spotify",
  description: "Buscar y descargar Spotify",

  run: async (client, m, args) => {
    try {
      // 👉 CUANDO PRESIONAN EL BOTÓN
      if (m.type === "buttonsResponseMessage") {
        const id = m.message.buttonsResponseMessage.selectedButtonId;

        if (!id.startsWith("SPDL:")) return;

        const spotifyUrl = id.replace("SPDL:", "");

        await client.reply(
          m.chat,
          "⬇️ Descargando...",
          m,
          global.channelInfo
        );

        const api =
          `https://api-adonix.ultraplus.click/download/spotify?apikey=dvyer&url=${encodeURIComponent(spotifyUrl)}`;

        const res = await axios.get(api);
        const song = res.data?.result;

        if (!song?.url) throw "error";

        return await client.sendMessage(
          m.chat,
          {
            audio: { url: song.url },
            mimetype: "audio/mpeg",
            fileName: `${song.title || "Spotify"}.mp3`
          },
          global.channelInfo
        );
      }

      // 👉 BÚSQUEDA NORMAL
      if (!args.length) return;

      const query = args.join(" ");

      await client.reply(
        m.chat,
        "🔎 Buscando...",
        m,
        global.channelInfo
      );

      const searchApi =
        `https://api-adonix.ultraplus.click/search/spotify?apikey=dvyer&query=${encodeURIComponent(query)}&type=track`;

      const search = await axios.get(searchApi);
      const results = search.data?.result?.results;

      if (!results || !results.length) {
        return client.reply(
          m.chat,
          "❌ Sin resultados",
          m,
          global.channelInfo
        );
      }

      const song = results[0];

      await client.sendMessage(
        m.chat,
        {
          image: { url: song.image },
          caption:
`🎵 ${song.title}
👤 ${song.artist}
💿 ${song.album}
⏱️ ${song.duration}`,
          buttons: [
            {
              buttonId: `SPDL:${song.link}`,
              buttonText: { displayText: "⬇️ Descargar" },
              type: 1
            }
          ],
          footer: "SonGoku",
          headerType: 4
        },
        global.channelInfo
      );

    } catch (e) {
      client.reply(
        m.chat,
        "⚠️ Error",
        m,
        global.channelInfo
      );
    }
  }
};