const fs = require("fs");
const path = require("path");
const {
  convertToMp3,
  convertToVoiceNote,
  deleteFileSafe,
  downloadAbsoluteFile,
  ensureTmpDir,
  extractYouTubeUrl,
  getCooldownRemaining,
  isHttpUrl,
  resolveFastestAudio,
  resolveYouTubeSearch,
  safeFileName,
} = require("../../lib/dvyerApi");

const AUDIO_QUALITY = "128k";
const COOLDOWN_TIME = 15 * 1000;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("ytdlmp3");

const cooldowns = new Map();

module.exports = {
  command: ["ytdlmp3"],
  categoria: "descarga",
  description: "Descarga musica de YouTube como nota de voz",

  run: async (client, m, args) => {
    const userId = m.sender;
    let sourceFile = null;
    let finalMp3 = null;
    let voiceOgg = null;

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
          "❌ Usa .ytdlmp3 <nombre o link de YouTube>",
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
              caption: `🎙️ Preparando nota de voz...\n\nTitulo: ${title}\nCalidad: ${AUDIO_QUALITY}`,
            }
          : {
              text: `🎙️ Preparando nota de voz...\n\nTitulo: ${title}\nCalidad: ${AUDIO_QUALITY}`,
            },
        { quoted: m, ...global.channelInfo },
      );

      const linkResult = await resolveFastestAudio(videoUrl, AUDIO_QUALITY);
      title = safeFileName(linkResult.title || title || "audio");

      const stamp = Date.now();
      sourceFile = path.join(TMP_DIR, `${stamp}-source.bin`);
      finalMp3 = path.join(TMP_DIR, `${stamp}-audio.mp3`);
      voiceOgg = path.join(TMP_DIR, `${stamp}-voice.ogg`);

      await downloadAbsoluteFile(linkResult.resolvedDownloadUrl, {
        outputPath: sourceFile,
        maxBytes: MAX_AUDIO_BYTES,
        minBytes: 100000,
      });

      await convertToMp3(sourceFile, finalMp3, AUDIO_QUALITY);
      await convertToVoiceNote(finalMp3, voiceOgg);

      await client.sendMessage(
        m.chat,
        {
          audio: { url: voiceOgg },
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
      console.error("YTDLMP3 ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "❌ Error al procesar la nota de voz."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(sourceFile);
      deleteFileSafe(finalMp3);
      deleteFileSafe(voiceOgg);
    }
  },
};
