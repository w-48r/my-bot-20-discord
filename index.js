require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ChannelType,
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

const MAX_BOTS = 20;


// ==================================================
// الرومات
// ==================================================

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

    console.log(
      `❌ BOT_TOKEN_${index} غير موجود`
    );

    return null;
  }


  const client = new Client({

    intents: [

      GatewayIntentBits.Guilds,

      GatewayIntentBits.GuildVoiceStates

    ]

  });


  // ----------------------------------------------
  // البوت جاهز
  // ----------------------------------------------

  client.once("clientReady", () => {

    console.log(
      `✅ البوت ${index} جاهز: ${client.user.tag}`
    );

  });


  // ----------------------------------------------
  // مراقبة خروج البوت
  // ----------------------------------------------

  client.on(
    "voiceStateUpdate",
    async (oldState, newState) => {

      if (!client.user) {
        return;
      }


      if (oldState.id !== client.user.id) {
        return;
      }


      // إذا البوت خرج من الروم
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

    }
  );


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
// تشغيل البوتات 1 - 20
// ==================================================

for (
  let i = 1;
  i <= MAX_BOTS;
  i++
) {

  const bot = createBot(i);

  if (bot) {

    bots[i] = bot;

  }

}


// ==================================================
// دخول البوت للروم
// ==================================================

async function joinBot(index) {

  // منع تكرار الدخول
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

    // --------------------------------------------
    // جلب السيرفر
    // --------------------------------------------

    const guild =
      await client.guilds.fetch(GUILD_ID);


    // --------------------------------------------
    // جلب الروم
    // --------------------------------------------

    const channel =
      await guild.channels.fetch(channelId);


    if (!channel) {

      console.log(
        `❌ روم البوت ${index} غير موجود`
      );

      return false;

    }


    // --------------------------------------------
    // التأكد أن الروم صوتي
    // --------------------------------------------

    if (

      channel.type !== ChannelType.GuildVoice &&

      channel.type !== ChannelType.GuildStageVoice

    ) {

      console.log(
        `❌ روم البوت ${index} ليس رومًا صوتيًا`
      );

      return false;

    }


    // --------------------------------------------
    // تشغيل الإرجاع التلقائي
    // --------------------------------------------

    shouldStay.add(index);


    // --------------------------------------------
    // اتصال مستقل لكل بوت
    // --------------------------------------------

    const group =
      `AUREX_BOT_${index}`;


    // حذف اتصال قديم لهذا البوت فقط
    const oldConnection =
      getVoiceConnection(
        GUILD_ID,
        group
      );


    if (oldConnection) {

      oldConnection.destroy();

    }


    // --------------------------------------------
    // دخول الروم
    // --------------------------------------------

    const connection =
      joinVoiceChannel({

        channelId: channel.id,

        guildId: GUILD_ID,

        adapterCreator:
          guild.voiceAdapterCreator,

        selfDeaf: false,

        selfMute: false,

        group: group

      });


    console.log(
      `🎧 البوت ${index} دخل الروم`
    );


    // --------------------------------------------
    // مراقبة الاتصال
    // --------------------------------------------

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
// إنشاء أوامر JOIN فقط
// ==================================================

function buildCommands() {

  const commands = [];


  for (
    let i = 1;
    i <= MAX_BOTS;
    i++
  ) {

    commands.push(

      new SlashCommandBuilder()

        .setName(`join${i}`)

        .setDescription(
          `إدخال البوت ${i} إلى الروم`
        )

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
      "❌ البوت 1 غير موجود"
    );

    return;

  }


  // ننتظر البوت 1
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
    console.log(
      "================================="
    );
    console.log(
      "📡 فحص أوامر /join..."
    );
    console.log(
      "=================================");


    const guild =
      await commandClient.guilds.fetch(
        GUILD_ID
      );


    const existingCommands =
      await guild.commands.fetch();


    const commands =
      buildCommands();


    // --------------------------------------------
    // إضافة الأوامر الناقصة فقط
    // --------------------------------------------

    for (const command of commands) {

      const exists =
        existingCommands.find(
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
        `➕ إضافة /${command.name}...`
      );


      await guild.commands.create(
        command
      );


      console.log(
        `✅ تمت إضافة /${command.name}`
      );


      // تأخير بسيط
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

    }


    console.log("");
    console.log(
      "================================="
    );
    console.log(
      "✅ انتهى تسجيل الأوامر"
    );
    console.log(
      "================================="
    );
    console.log(
      "🎧 /join1 إلى /join20"
    );
    console.log(
      "================================="
    );
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
// استقبال أوامر Discord
// ==================================================

const commandClient = bots[1];


if (commandClient) {

  commandClient.on(
    "interactionCreate",
    async (interaction) => {

      if (!interaction.isChatInputCommand()) {

        return;

      }


      const command =
        interaction.commandName;


      // ------------------------------------------
      // JOIN 1 - 20
      // ------------------------------------------

      const joinMatch =
        command.match(
          /^join(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)$/
        );


      if (!joinMatch) {

        return;

      }


      const index =
        Number(joinMatch[1]);


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

    }
  );

}


// ==================================================
// تشغيل النظام
// ==================================================

console.log("");
console.log(
  "================================="
);
console.log(
  "🚀 AUREX 20 BOTS SYSTEM"
);
console.log(
  "================================="
);
console.log(
  "🤖 البوتات: 1 - 20"
);
console.log(
  "🎧 الأوامر: /join1 - /join20"
);
console.log(
  "🚫 لا توجد أوامر Leave"
);
console.log(
  "================================="
);
console.log("");


// ==================================================
// تسجيل الأوامر بعد 5 ثواني
// ==================================================

setTimeout(() => {

  registerCommands();

}, 5000);
