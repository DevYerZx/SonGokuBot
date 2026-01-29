const fs = require("fs");
const path = require("path");
const yts = require("yt-search");
const { exec } = require("child_process");

const MAX_AUDIO_MB = 16;

module.exports = {
  command: ["yta", "ytaudio"],
  categoria: "descarga",
  description: "Descarga audio MP3 de YouTube en buena calidad",

  run: async (client, m, args) => {
    if (!args.length)
      return client.reply(m.chat, "❌ Ingresa un nombre o enlace de YouTube", m);

    const query = args.join(" ");
    const search = await yts(query);
    const video = search.videos[0];

    if (!video)
      return client.reply(m.chat, "❌ No se encontró el video", m);

    const title = video.title.replace(/[^\w\s]/gi, "");
    const output = path.join(__dirname, `./tmp/${title}.mp3`);

    // 🔔 MENSAJE DE PROCESO
    await client.reply(
      m.chat,
`╔══════════ 🎧 YT MP3 ══════════╗
║ 🎵 ${video.title}
║ ⏳ Procesando audio…
║ 🎚️ Calidad: 128 kbps MP3
║ 🤖 SonGokuBot
╚═══════════════════════════════╝`,
      m
    );

    // ⬇️ DESCARGA + CONVERSIÓN
    exec(
      `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${output}" "${video.url}"`,
      async (err) => {
        if (err || !fs.existsSync(output)) {
          return client.reply(m.chat, "❌ Error al convertir el audio", m);
        }

        const sizeMB = fs.statSync(output).size / (1024 * 1024);
        const caption =
`╔══════════ 🎶 AUDIO LISTO ══════════╗
║ 🎵 ${video.title}
║ 👤 ${video.author.name}
║ ⏱️ ${video.timestamp}
║ 🎚️ 128 kbps MP3
║ 📦 ${sizeMB.toFixed(2)} MB
║ 🤖 SonGokuBot
╚════════════════════════════════════╝`;

        // 📤 ENVÍO INTELIGENTE
        if (sizeMB > MAX_AUDIO_MB) {
          await client.sendMessage(
            m.chat,
            {
              document: fs.readFileSync(output),
              mimetype: "audio/mpeg",
              fileName: `${title}.mp3`,
              caption
            },
            { quoted: m }
          );
        } else {
          await client.sendMessage(
            m.chat,
            {
              audio: fs.readFileSync(output),
              mimetype: "audio/mpeg",
              caption
            },
            { quoted: m }
          );
        }

        fs.unlinkSync(output);
      }
    );
  }
};