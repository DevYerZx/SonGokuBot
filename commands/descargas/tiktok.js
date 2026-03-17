const fs = require("fs");
const path = require("path");
const {
  API_BASE,
  apiGet,
  convertToMp3,
  deleteFileSafe,
  downloadApiFile,
  ensureTmpDir,
  extractTikTokUrl,
  getCooldownRemaining,
  normalizeMp3Name,
  normalizeMp4Name,
  resolveCommandInput,
  safeFileName,
  sendAudioFile,
  sendVideoOrDocument,
} = require("../../lib/dvyerApi");

const API_TIKTOK_URL = `${API_BASE}/ttdlmp4`;
const VIDEO_QUALITY = "hd";
const API_LANG = "es";
const COOLDOWN_TIME = 15 * 1000;
const MAX_VIDEO_BYTES = 120 * 1024 * 1024;
const VIDEO_AS_DOCUMENT_THRESHOLD = 45 * 1024 * 1024;
const AUDIO_AS_DOCUMENT_THRESHOLD = 60 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("tiktok");
const cooldowns = new Map();

async function requestTikTokMeta(videoUrl) {
  const data = await apiGet(
    API_TIKTOK_URL,
    {
      mode: "link",
      quality: VIDEO_QUALITY,
      lang: API_LANG,
      url: videoUrl,
    },
    45000,
  );

  return {
    title: safeFileName(data?.title || data?.result?.title || "tiktok"),
    thumbnail: data?.thumbnail || data?.result?.thumbnail || null,
    fileName: normalizeMp4Name(data?.filename || data?.file_name || "tiktok.mp4"),
  };
}

module.exports = {
  command: ["tiktok", "tt", "ttdlmp4"],
  categoria: "descarga",
  description: "Descarga TikTok usando tu API nueva",

  run: async (client, m, args) => {
    const userId = `${m.sender}:tiktok`;
    const until = cooldowns.get(userId);
    let videoPath = null;
    let audioPath = null;

    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `Espera ${getCooldownRemaining(until)}s antes de volver a usar TikTok.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const rawInput = resolveCommandInput(args, m);
      const videoUrl = extractTikTokUrl(rawInput);

      if (!videoUrl) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "Uso: .tiktok <link de TikTok> o responde a un mensaje con el link",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        `Preparando TikTok...\nAPI: ${API_BASE}`,
        m,
        global.channelInfo,
      );

      const info = await requestTikTokMeta(videoUrl);

      if (info.thumbnail) {
        await client.sendMessage(
          m.chat,
          {
            image: { url: info.thumbnail },
            caption: `TikTok\n\n${info.title}`,
          },
          { quoted: m, ...global.channelInfo },
        );
      }

      videoPath = path.join(TMP_DIR, `${Date.now()}-${info.fileName}`);
      const downloaded = await downloadApiFile(API_TIKTOK_URL, {
        params: {
          mode: "file",
          quality: VIDEO_QUALITY,
          lang: API_LANG,
          url: videoUrl,
        },
        outputPath: videoPath,
        maxBytes: MAX_VIDEO_BYTES,
        minBytes: 100000,
      });

      await sendVideoOrDocument(
        client,
        m.chat,
        { quoted: m, ...global.channelInfo },
        {
          filePath: downloaded.tempPath,
          fileName: normalizeMp4Name(downloaded.fileName || info.fileName),
          title: info.title,
          size: downloaded.size,
          documentThreshold: VIDEO_AS_DOCUMENT_THRESHOLD,
          caption: `TikTok\n\n${info.title}`,
        },
      );

      audioPath = path.join(TMP_DIR, `${Date.now()}-audio.mp3`);

      try {
        await convertToMp3(downloaded.tempPath, audioPath, "128k");

        const audioSize = fs.existsSync(audioPath) ? fs.statSync(audioPath).size : 0;
        if (audioSize > 0) {
          await sendAudioFile(
            client,
            m.chat,
            { quoted: m, ...global.channelInfo },
            {
              filePath: audioPath,
              fileName: normalizeMp3Name(info.title),
              title: `${info.title} (audio)`,
              size: audioSize,
              documentThreshold: AUDIO_AS_DOCUMENT_THRESHOLD,
              caption: `TikTok Audio\n\n${info.title}`,
            },
          );
        }
      } catch (audioError) {
        console.error("TIKTOK AUDIO ERROR:", audioError?.message || audioError);
      }
    } catch (error) {
      console.error("TIKTOK ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "No se pudo procesar el TikTok."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(videoPath);
      deleteFileSafe(audioPath);
    }
  },
};
