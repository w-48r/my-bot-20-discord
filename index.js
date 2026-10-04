require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ChannelType
} = require("discord.js");

const {
  joinVoiceChannel,
  getVoiceConnection
} = require("@discordjs/voice");

const GUILD_ID = "1362808759495299252";

const CHANNELS = {
  1: "1539040980966052011",
  2: "1544179958048362567",
  3: "1540833084620931202",
  4: "1540836652354895892",
  5: "1544179898195775488",
  6: "1542316386184073378",
  7: "1540836540635291698",
  8: "1544179920513671259",
  9: "1548405885146239036",
  10: "1542861660153315389",
  11: "1544180010976550953",
  12: "1550956198289735700",
  13: "1544179975031234581",
  14: "1544179940461641769",
  15: "1544179992936714320",
  16: "1556015627565797517",
  17: "1556015651972186293",
  18: "1556015673006759977",
  19: "1556015694519468152",
  20: "1556015714618310780"
};

const bots = [];
const joining = new Set();

function createBot(index) {
  const token = process.env[`BOT_TOKEN_${index}`];

  if (!token) {
    console.log(`❌ BOT_TOKEN_${index} غير موجود`);
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  client.once("ready", () => {
    console.log(`✅ البوت ${index} دخل: ${client.user.tag}`);
  });

  client.on("voiceStateUpdate", async (oldState, newState) => {
    // إذا البوت انطرد أو خرج من الروم، رجعه لرومه
    if (!client.user) return;

    if (oldState.member?.id !== client.user.id) return;

    const targetChannel = CHANNELS[index];

    if (!targetChannel) return;

    if (!newState.channelId) {
      setTimeout(() => {
        joinBot(index);
      }, 3000);
    }
  });

  client.login(token).catch((err) => {
    console.log(`❌ فشل تسجيل دخول البوت ${index}:`, err.message);
  });

  return client;
}

for (let i = 1; i <= 20; i++) {
  const bot = createBot(i);

  if (bot) {
    bots[i] = bot;
  }
}

async function joinBot(index) {
  if (joining.has(index)) return;

  const client = bots[index];
  const channelId = CHANNELS[index];

  if (!client || !client.isReady()) {
    console.log(`❌ البوت ${index} غير جاهز`);
    return false;
  }

  joining.add(index);

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      console.log(`❌ البوت ${index}: الروم غير موجود`);
      return false;
    }

    if (
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.GuildStageVoice
    ) {
      console.log(`❌ البوت ${index}: هذا ليس روم صوتي`);
      return false;
    }

    const oldConnection = getVoiceConnection(GUILD_ID, index);

    if (oldConnection) {
      oldConnection.destroy();
    }

    joinVoiceChannel({
      channelId: channel.id,
      guildId: GUILD_ID,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    console.log(`🎧 البوت ${index} دخل الروم`);

    return true;
  } catch (error) {
    console.log(`❌ خطأ في دخول البوت ${index}:`, error.message);
    return false;
  } finally {
    joining.delete(index);
  }
}

async function leaveBot(index) {
  const client = bots[index];

  if (!client || !client.isReady()) {
    console.log(`❌ البوت ${index} غير جاهز`);
    return false;
  }

  try {
    const guild = await client.guilds.fetch(GUILD_ID);

    const connection = getVoiceConnection(GUILD_ID, index);

    if (connection) {
      connection.destroy();
    }

    const me = guild.members.me;

    if (me && me.voice.channelId) {
      await me.voice.disconnect().catch(() => {});
    }

    console.log(`🚪 البوت ${index} خرج من الروم`);

    return true;
  } catch (error) {
    console.log(`❌ خطأ في إخراج البوت ${index}:`, error.message);
    return false;
  }
}

// ===============================
// أوامر البوت رقم 1
// ===============================

const commandClient = bots[1];

if (commandClient) {
  commandClient.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    const joinMatch = command.match(/^join(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)$/);
    const leaveMatch = command.match(/^leave(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)$/);

    try {
      if (joinMatch) {
        const index = Number(joinMatch[1]);

        await interaction.reply({
          content: `⏳ جاري إدخال البوت ${index}...`,
          ephemeral: true
        });

        const success = await joinBot(index);

        if (success) {
          await interaction.editReply(
            `✅ البوت ${index} دخل الروم الخاص فيه`
          );
        } else {
          await interaction.editReply(
            `❌ ما قدرت أدخل البوت ${index}`
          );
        }

        return;
      }

      if (leaveMatch) {
        const index = Number(leaveMatch[1]);

        await interaction.reply({
          content: `⏳ جاري إخراج البوت ${index}...`,
          ephemeral: true
        });

        const success = await leaveBot(index);

        if (success) {
          await interaction.editReply(
            `✅ البوت ${index} خرج من الروم`
          );
        } else {
          await interaction.editReply(
            `❌ ما قدرت أخرج البوت ${index}`
          );
        }

        return;
      }
    } catch (error) {
      console.log("❌ Interaction error:", error);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply("❌ صار خطأ أثناء تنفيذ الأمر");
      }
    }
  });
}

console.log("🚀 AUREX 20 BOTS SYSTEM STARTED");
console.log("🎧 الأوامر: /join1 إلى /join20");
console.log("🚪 الأوامر: /leave1 إلى /leave20");
