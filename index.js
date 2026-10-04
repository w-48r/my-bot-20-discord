require("dotenv").config();

const http = require("http");

http
  .createServer((req, res) => {
    res.end("AUREX 20 Bots Online!");
  })
  .listen(process.env.PORT || 10000);

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");

const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} = require("@discordjs/voice");

const BOT_COUNT = 20;
const GUILD_ID = "1362808759495299252";

const bots = [
  { token: process.env.BOT_TOKEN_1, channelId: "1539040980966052011" },
  { token: process.env.BOT_TOKEN_2, channelId: "1544179958048362567" },
  { token: process.env.BOT_TOKEN_3, channelId: "1540833084620931202" },
  { token: process.env.BOT_TOKEN_4, channelId: "1540836652354895892" },
  { token: process.env.BOT_TOKEN_5, channelId: "1544179898195775488" },
  { token: process.env.BOT_TOKEN_6, channelId: "1542316386184073378" },
  { token: process.env.BOT_TOKEN_7, channelId: "1540836540635291698" },
  { token: process.env.BOT_TOKEN_8, channelId: "1544179920513671259" },
  { token: process.env.BOT_TOKEN_9, channelId: "1548405885146239036" },
  { token: process.env.BOT_TOKEN_10, channelId: "1542861660153315389" },
  { token: process.env.BOT_TOKEN_11, channelId: "1544180010976550953" },
  { token: process.env.BOT_TOKEN_12, channelId: "1550956198289735700" },
  { token: process.env.BOT_TOKEN_13, channelId: "1544179975031234581" },
  { token: process.env.BOT_TOKEN_14, channelId: "1544179940461641769" },
  { token: process.env.BOT_TOKEN_15, channelId: "1544179992936714320" },
  { token: process.env.BOT_TOKEN_16, channelId: "1556015627565797517" },
  { token: process.env.BOT_TOKEN_17, channelId: "1556015651972186293" },
  { token: process.env.BOT_TOKEN_18, channelId: "1556015673006759977" },
  { token: process.env.BOT_TOKEN_19, channelId: "1556015694519468152" },
  { token: process.env.BOT_TOKEN_20, channelId: "1556015714618310780" },
];

const clients = new Array(BOT_COUNT);
const connections = new Array(BOT_COUNT).fill(null);
const reconnectTimers = new Array(BOT_COUNT).fill(null);
const shouldStay = new Array(BOT_COUNT).fill(false);

/* =================================
   تشغيل الـ20 بوت
================================= */

for (let i = 0; i < BOT_COUNT; i++) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  clients[i] = client;

  client.once("ready", () => {
    console.log(`✅ البوت ${i + 1} جاهز: ${client.user.tag}`);
  });

  if (!bots[i].token) {
    console.log(`❌ BOT_TOKEN_${i + 1} غير موجود في .env`);
    continue;
  }

  client.login(bots[i].token).catch((error) => {
    console.log(
      `❌ فشل تسجيل البوت ${i + 1}: ${error.message}`
    );
  });
}

/* =================================
   دخول البوت للروم
================================= */

async function joinBot(index) {
  const client = clients[index];

  if (!client || !client.isReady()) {
    console.log(`❌ البوت ${index + 1} غير جاهز`);
    return false;
  }

  shouldStay[index] = true;

  if (reconnectTimers[index]) {
    clearTimeout(reconnectTimers[index]);
    reconnectTimers[index] = null;
  }

  try {
    const channel = await client.channels.fetch(
      bots[index].channelId
    );

    if (!channel || !channel.isVoiceBased()) {
      console.log(
        `❌ البوت ${index + 1}: الروم غير صحيح`
      );
      return false;
    }

    if (connections[index]) {
      try {
        connections[index].destroy();
      } catch {}

      connections[index] = null;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      group: `AUREX-BOT-${index + 1}`,
      selfDeaf: false,
      selfMute: false,
    });

    connections[index] = connection;

    connection.on("stateChange", (oldState, newState) => {
      if (
        newState.status === VoiceConnectionStatus.Disconnected ||
        newState.status === VoiceConnectionStatus.Destroyed
      ) {
        connections[index] = null;

        if (!shouldStay[index]) {
          return;
        }

        console.log(
          `⚠️ البوت ${index + 1} انفصل من الروم`
        );

        if (reconnectTimers[index]) {
          return;
        }

        reconnectTimers[index] = setTimeout(async () => {
          reconnectTimers[index] = null;

          if (shouldStay[index]) {
            console.log(
              `🔄 محاولة إعادة البوت ${index + 1}...`
            );

            await joinBot(index);
          }
        }, 5000);
      }
    });

    await entersState(
      connection,
      VoiceConnectionStatus.Ready,
      30000
    );

    console.log(
      `🎧 البوت ${index + 1} دخل: ${channel.name}`
    );

    return true;
  } catch (error) {
    console.log(
      `❌ خطأ في البوت ${index + 1}: ${error.message}`
    );

    return false;
  }
}

/* =================================
   إخراج البوت
================================= */

async function leaveBot(index) {
  shouldStay[index] = false;

  if (reconnectTimers[index]) {
    clearTimeout(reconnectTimers[index]);
    reconnectTimers[index] = null;
  }

  if (connections[index]) {
    try {
      connections[index].destroy();
    } catch {}

    connections[index] = null;
  }

  console.log(
    `👋 البوت ${index + 1} خرج من الروم`
  );
}

/* =================================
   بوت الأوامر
================================= */

const commandClient = clients[0];

/* =================================
   إضافة أوامر 16 - 20 فقط
================================= */

commandClient.once("ready", async () => {
  try {
    console.log(
      "🔄 جاري إضافة أوامر البوتات 16 إلى 20..."
    );

    const guild = await commandClient.guilds.fetch(
      GUILD_ID
    );

    console.log(
      `✅ تم العثور على السيرفر: ${guild.name}`
    );

    for (let i = 16; i <= 20; i++) {
      const joinName = `join${i}`;
      const leaveName = `leave${i}`;

      /* حذف الأمر إذا كان موجودًا مسبقًا */
      const existingCommands =
        await guild.commands.fetch();

      const oldJoin = existingCommands.find(
        (command) => command.name === joinName
      );

      const oldLeave = existingCommands.find(
        (command) => command.name === leaveName
      );

      if (oldJoin) {
        await guild.commands.delete(oldJoin.id);
        console.log(`🗑️ تم حذف ${joinName} القديم`);
      }

      if (oldLeave) {
        await guild.commands.delete(oldLeave.id);
        console.log(`🗑️ تم حذف ${leaveName} القديم`);
      }

      /* إنشاء JOIN */
      await guild.commands.create({
        name: joinName,
        description: `إدخال البوت ${i} إلى الروم`,
        default_member_permissions:
          PermissionFlagsBits.ManageGuild.toString(),
      });

      console.log(`✅ تم إضافة /${joinName}`);

      /* إنشاء LEAVE */
      await guild.commands.create({
        name: leaveName,
        description: `إخراج البوت ${i} من الروم`,
        default_member_permissions:
          PermissionFlagsBits.ManageGuild.toString(),
      });

      console.log(`✅ تم إضافة /${leaveName}`);
    }

    console.log(
      "🔥 تم الانتهاء! أوامر 16 إلى 20 جاهزة."
    );
  } catch (error) {
    console.log(
      "❌ خطأ في تسجيل أوامر 16-20:"
    );

    console.log(error.message || error);
  }
});

/* =================================
   استقبال الأوامر
================================= */

commandClient.on(
  "interactionCreate",
  async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content:
          "❌ تحتاج صلاحية Manage Server لاستخدام هذا الأمر.",
        ephemeral: true,
      });
    }

    /* JOIN */

    if (
      interaction.commandName.startsWith("join")
    ) {
      const number = Number(
        interaction.commandName.replace(
          "join",
          ""
        )
      );

      if (
        number >= 1 &&
        number <= BOT_COUNT
      ) {
        await interaction.reply(
          `🔄 جاري إدخال البوت ${number}...`
        );

        const success = await joinBot(
          number - 1
        );

        if (success) {
          await interaction.editReply(
            `✅ البوت ${number} دخل الروم بنجاح 🎧`
          );
        } else {
          await interaction.editReply(
            `❌ فشل إدخال البوت ${number}.`
          );
        }
      }

      return;
    }

    /* LEAVE */

    if (
      interaction.commandName.startsWith("leave")
    ) {
      const number = Number(
        interaction.commandName.replace(
          "leave",
          ""
        )
      );

      if (
        number >= 1 &&
        number <= BOT_COUNT
      ) {
        await interaction.reply(
          `🔄 جاري إخراج البوت ${number}...`
        );

        await leaveBot(number - 1);

        await interaction.editReply(
          `👋 البوت ${number} خرج من الروم.`
        );
      }
    }
  }
);

/* =================================
   حماية من الأخطاء
================================= */

process.on(
  "unhandledRejection",
  (error) => {
    console.log(
      "⚠️ Unhandled Rejection:",
      error?.message || error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.log(
      "⚠️ Uncaught Exception:",
      error?.message || error
    );
  }
);