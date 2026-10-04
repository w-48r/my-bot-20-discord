require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus
} = require("@discordjs/voice");


// ==================================================
// الإعدادات
// ==================================================

const GUILD_ID = "1362808759495299252";

const MAX_BOTS = 17;

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
  17: "1556015651972186293"
};


// ==================================================
// تخزين البوتات
// ==================================================

const bots = [];

const shouldStay = new Set();

const joining = new Set();


// ==================================================
// إنشاء البوت
// ==================================================

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


  // ----------------------------------------------
  // جاهز
  // ----------------------------------------------

  client.once("clientReady", () => {

    console.log(
      `✅ البوت ${index} جاهز: ${client.user.tag}`
    );

  });


  // ----------------------------------------------
  // مراقبة خروج البوت من الروم
  // ----------------------------------------------

  client.on("voiceStateUpdate", async (oldState, newState) => {

    if (!client.user) {
      return;
    }

    if (oldState.id !== client.user.id) {
      return;
    }

    // البوت خرج من الروم
    if (
      oldState.channelId &&
      !newState.channelId &&
      shouldStay.has(index)
    ) {

      console.log(
        `⚠️ البوت ${index} خرج من الروم`
      );

      setTimeout(() => {

        if (shouldStay.has(index)) {
          joinBot(index);
        }

      }, 5000);

    }

  });


  // ----------------------------------------------
  // تسجيل الدخول
  // ----------------------------------------------

  client.login(token).catch((error) => {

    console.log(
      `❌ فشل تسجيل دخول البوت ${index}: ${error.message}`
    );

  });


  return client;
}


// ==================================================
// تشغيل البوتات 1 - 17
// ==================================================

for (let i = 1; i <= MAX_BOTS; i++) {

  const bot = createBot(i);

  if (bot) {
    bots[i] = bot;
  }

}


// ==================================================
// دخول البوت للروم
// ==================================================

async function joinBot(index) {

  if (joining.has(index)) {
    return false;
  }

  const client = bots[index];

  const channelId = CHANNELS[index];

  if (!client) {

    console.log(
      `❌ البوت ${index} غير موجود`
    );

    return false;
  }

  if (!client.isReady()) {

    console.log(
      `❌ البوت ${index} غير جاهز`
    );

    return false;
  }

  joining.add(index);

  try {

    const guild = await client.guilds.fetch(GUILD_ID);

    const channel = await guild.channels.fetch(channelId);


    // ----------------------------------------------
    // التأكد من الروم
    // ----------------------------------------------

    if (!channel) {

      console.log(
        `❌ روم البوت ${index} غير موجود`
      );

      return false;
    }


    if (
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.GuildStageVoice
    ) {

      console.log(
        `❌ روم البوت ${index} ليس رومًا صوتيًا`
      );

      return false;
    }


    // ----------------------------------------------
    // نخلي البوت يرجع إذا خرج
    // ----------------------------------------------

    shouldStay.add(index);


    // ----------------------------------------------
    // اتصال مستقل لكل بوت
    // ----------------------------------------------

    const group = `AUREX_BOT_${index}`;


    // إذا عنده اتصال قديم، نحذفه
    const oldConnection = getVoiceConnection(
      GUILD_ID,
      group
    );

    if (oldConnection) {
      oldConnection.destroy();
    }


    // ----------------------------------------------
    // دخول الروم
    // ----------------------------------------------

    const connection = joinVoiceChannel({

      channelId: channel.id,

      guildId: GUILD_ID,

      adapterCreator: guild.voiceAdapterCreator,

      selfDeaf: false,

      selfMute: false,

      group: group

    });


    console.log(
      `🎧 البوت ${index} دخل الروم`
    );


    // ----------------------------------------------
    // إذا انقطع الاتصال
    // ----------------------------------------------

    connection.on(
      VoiceConnectionStatus.Disconnected,
      () => {

        if (!shouldStay.has(index)) {
          return;
        }

        console.log(
          `⚠️ اتصال البوت ${index} انقطع`
        );

        setTimeout(() => {

          if (shouldStay.has(index)) {
            joinBot(index);
          }

        }, 5000);

      }
    );


    return true;

  } catch (error) {

    console.log(
      `❌ خطأ في دخول البوت ${index}: ${error.message}`
    );

    return false;

  } finally {

    joining.delete(index);

  }

}


// ==================================================
// إخراج البوت
// ==================================================

async function leaveBot(index) {

  const client = bots[index];

  if (!client) {
    return false;
  }


  // يمنع الإرجاع التلقائي
  shouldStay.delete(index);


  try {

    const group = `AUREX_BOT_${index}`;


    const connection = getVoiceConnection(
      GUILD_ID,
      group
    );


    if (connection) {
      connection.destroy();
    }


    console.log(
      `🚪 البوت ${index} خرج من الروم`
    );


    return true;

  } catch (error) {

    console.log(
      `❌ خطأ في إخراج البوت ${index}: ${error.message}`
    );

    return false;

  }

}


// ==================================================
// إنشاء أوامر Discord
// ==================================================

function buildCommands() {

  const commands = [];


  for (let i = 1; i <= MAX_BOTS; i++) {

    commands.push(

      new SlashCommandBuilder()
        .setName(`join${i}`)
        .setDescription(`إدخال البوت ${i} إلى الروم`)

        .toJSON(),

      new SlashCommandBuilder()
        .setName(`leave${i}`)
        .setDescription(`إخراج البوت ${i} من الروم`)

        .toJSON()

    );

  }


  return commands;
}


// ==================================================
// تسجيل الأوامر
// ==================================================

async function registerCommands() {

  const commandClient = bots[1];

  if (!commandClient) {

    console.log(
      "❌ البوت 1 غير موجود، لا يمكن تسجيل الأوامر"
    );

    return;

  }


  // ننتظر حتى يصبح البوت 1 جاهزًا
  if (!commandClient.isReady()) {

    await new Promise((resolve) => {

      commandClient.once(
        "clientReady",
        resolve
      );

    });

  }


  try {

    console.log("");
    console.log("=================================");
    console.log("📡 فحص أوامر Discord...");
    console.log("=================================");


    const guild = await commandClient.guilds.fetch(
      GUILD_ID
    );


    const existingCommands =
      await guild.commands.fetch();


    const commands = buildCommands();


    // ----------------------------------------------
    // نسجل فقط الأوامر الناقصة
    // ----------------------------------------------

    for (const command of commands) {

      const exists = existingCommands.find(
        (existing) =>
          existing.name === command.name
      );


      if (exists) {

        console.log(
          `☑️ موجود: /${command.name}`
        );

        continue;

      }


      console.log(
        `➕ جاري إضافة /${command.name}...`
      );


      await guild.commands.create(command);


      console.log(
        `✅ تمت إضافة /${command.name}`
      );


      // تأخير بسيط حتى لا نضغط API
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

    }


    console.log("");
    console.log("=================================");
    console.log("✅ انتهى تسجيل الأوامر");
    console.log("=================================");
    console.log("🎧 /join1 إلى /join17");
    console.log("🚪 /leave1 إلى /leave17");
    console.log("=================================");
    console.log("");

  } catch (error) {

    console.log("");
    console.log(
      `❌ خطأ في تسجيل الأوامر: ${error.message}`
    );
    console.log("");

  }

}


// ==================================================
// أوامر التفاعل
// ==================================================

const commandClient = bots[1];


if (commandClient) {

  commandClient.on(
    "interactionCreate",
    async (interaction) => {

      if (!interaction.isChatInputCommand()) {
        return;
      }


      const command = interaction.commandName;


      // ------------------------------------------
      // JOIN
      // ------------------------------------------

      const joinMatch = command.match(
        /^join(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17)$/
      );


      if (joinMatch) {

        const index = Number(
          joinMatch[1]
        );


        try {

          await interaction.reply({

            content:
              `⏳ جاري إدخال البوت ${index}...`,

            ephemeral: true

          });


          const success =
            await joinBot(index);


          if (success) {

            await interaction.editReply({

              content:
                `✅ البوت ${index} دخل الروم الخاص فيه 🎧`

            });

          } else {

            await interaction.editReply({

              content:
                `❌ ما قدرت أدخل البوت ${index}`

            });

          }

        } catch (error) {

          console.log(
            `❌ خطأ في /join${index}:`,
            error
          );


          if (
            interaction.replied ||
            interaction.deferred
          ) {

            await interaction.editReply({

              content:
                "❌ صار خطأ أثناء تنفيذ الأمر"

            });

          }

        }


        return;

      }


      // ------------------------------------------
      // LEAVE
      // ------------------------------------------

      const leaveMatch = command.match(
        /^leave(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17)$/
      );


      if (leaveMatch) {

        const index = Number(
          leaveMatch[1]
        );


        try {

          await interaction.reply({

            content:
              `⏳ جاري إخراج البوت ${index}...`,

            ephemeral: true

          });


          const success =
            await leaveBot(index);


          if (success) {

            await interaction.editReply({

              content:
                `✅ البوت ${index} خرج من الروم 🚪`

            });

          } else {

            await interaction.editReply({

              content:
                `❌ ما قدرت أخرج البوت ${index}`

            });

          }

        } catch (error) {

          console.log(
            `❌ خطأ في /leave${index}:`,
            error
          );


          if (
            interaction.replied ||
            interaction.deferred
          ) {

            await interaction.editReply({

              content:
                "❌ صار خطأ أثناء تنفيذ الأمر"

            });

          }

        }


        return;

      }

    }
  );

}


// ==================================================
// بدء النظام
// ==================================================

console.log("");
console.log("=================================");
console.log("🚀 AUREX 17 BOTS SYSTEM");
console.log("=================================");
console.log("🤖 البوتات: 1 - 17");
console.log("🎧 الأوامر: /join1 - /join17");
console.log("🚪 الأوامر: /leave1 - /leave17");
console.log("=================================");
console.log("");


// تسجيل الأوامر بعد تشغيل البوتات
setTimeout(() => {

  registerCommands();

}, 5000);
