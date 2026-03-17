const fs = require("fs");
const path = require("path");
const {
  convertToMp3,
  deleteFileSafe,
  downloadAbsoluteFile,
  ensureTmpDir,
  extractYouTubeUrl,
  getCooldownRemaining,
  isHttpUrl,
  normalizeMp3Name,
  resolveFastestAudio,
  resolveYouTubeSearch,
  safeFileName,
  sendAudioFile,
} = require("../../lib/dvyerApi");

const BOT_NAME = global.namebot || "SonGokuBot";
const AUDIO_QUALITY = "128k";
const COOLDOWN_TIME = 15 * 1000;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const AUDIO_AS_DOCUMENT_THRESHOLD = 60 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("ytmp3");

const cooldowns = new Map();

module.exports = {
  command: ["ytmp3", "ytaudio"],
  categoria: "descarga",
  description: "Descarga audio MP3 de YouTube con la API nueva",

  run: async (client, m, args) => {
    const userId = `${m.sender}:audio`;
    let sourceFile = null;
    let finalMp3 = null;

    const until = cooldowns.get(userId);
    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `⏳ Espera ${getCooldownRemaining(until)}s antes de volver a usar este comando.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const rawInput = args.join(" ").trim();
      if (!rawInput) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ Usa .ytmp3 <nombre o link de YouTube>",
          m,
          global.channelInfo,
        );
      }

      let videoUrl = extractYouTubeUrl(rawInput);
      let title = "audio";
      let thumbnail = null;

      if (!videoUrl) {
        if (isHttpUrl(rawInput)) {
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ Envia un link valido de YouTube.",
            m,
            global.channelInfo,
          );
        }

        const search = await resolveYouTubeSearch(rawInput);
        videoUrl = search.videoUrl;
        title = search.title;
        thumbnail = search.thumbnail;
      }

      await client.sendMessage(
        m.chat,
        thumbnail
          ? {
              image: { url: thumbnail },
              caption: `🎧 Preparando audio...\n\nTitulo: ${title}\nCalidad: ${AUDIO_QUALITY}\nAPI: ${BOT_NAME}`,
            }
          : {
              text: `🎧 Preparando audio...\n\nTitulo: ${title}\nCalidad: ${AUDIO_QUALITY}\nAPI: ${BOT_NAME}`,
            },
        { quoted: m, ...global.channelInfo },
      );

      const linkResult = await resolveFastestAudio(videoUrl, AUDIO_QUALITY);
      title = safeFileName(linkResult.title || title || "audio");

      const stamp = Date.now();
      sourceFile = path.join(TMP_DIR, `${stamp}-source.bin`);
      finalMp3 = path.join(TMP_DIR, `${stamp}-audio.mp3`);

      await downloadAbsoluteFile(linkResult.resolvedDownloadUrl, {
        outputPath: sourceFile,
        maxBytes: MAX_AUDIO_BYTES,
        minBytes: 100000,
      });

      await convertToMp3(sourceFile, finalMp3, AUDIO_QUALITY);

      const finalSize = fs.existsSync(finalMp3) ? fs.statSync(finalMp3).size : 0;

      await sendAudioFile(
        client,
        m.chat,
        { quoted: m, ...global.channelInfo },
        {
          filePath: finalMp3,
          title,
          fileName: normalizeMp3Name(linkResult.fileName || title),
          size: finalSize,
          documentThreshold: AUDIO_AS_DOCUMENT_THRESHOLD,
          caption: `🎶 ${title}${linkResult.duration ? `\nDuracion: ${linkResult.duration}` : ""}\n🤖 ${BOT_NAME}`,
        },
      );
    } catch (error) {
      console.error("YTMP3 ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "❌ No se pudo procesar el audio."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(sourceFile);
      deleteFileSafe(finalMp3);
    }
  },
};
