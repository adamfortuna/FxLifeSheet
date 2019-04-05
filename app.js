// Third party dependencies
var moment = require("moment");
console.log(moment().week());
// Telegram setup
var Telegraf = require("telegraf");
var Router = Telegraf.Router, Markup = Telegraf.Markup, Extra = Telegraf.Extra;
var bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Sheets setup
var GoogleSpreadsheet = require("google-spreadsheet");
var async = require("async");
// spreadsheet key is the long id in the sheets URL
console.log("Loading " + process.env.GOOGLE_SHEETS_SHEET_ID);
var doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SHEET_ID);
var sheet;
// State
var currentlyAskedQuestionKey = null;
var currentlyAskedQuestionMessageId = null;
async.series([
    function setAuth(step) {
        // var creds = {
        //   client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        //   private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY
        // };
        var creds = require("./credentials.json");
        doc.useServiceAccountAuth(creds, step);
    },
    function getInfoAndWorksheets(step) {
        doc.getInfo(function (err, info) {
            console.log("Loaded doc: " + info.title + " by " + info.author.email);
            sheet = info.worksheets[0];
            console.log("sheet 1: " +
                sheet.title +
                " " +
                sheet.rowCount +
                "x" +
                sheet.colCount);
            step();
        });
    }
], function (err) {
    if (err) {
        console.log("Error: " + err);
    }
    else {
        console.log("✅ Login successful, bot is running now");
        // App logic
        initBot();
    }
});
// App logic
function initBot() {
    bot.hears(/(\d+)/, function (ctx) {
        if (currentlyAskedQuestionMessageId == null) {
            ctx.reply("Sorry, I forgot the question I asked, this usually means it took too long for you to respond, please trigger the question again by running the `/` command");
            return;
        }
        // user replied with a value
        var userValue = ctx.match[1];
        console.log("Got a new value: " +
            userValue +
            " for question " +
            currentlyAskedQuestionKey);
        var dateToAdd = new Date();
        var weekOfYear = moment().week();
        var row = {
            Timestamp: dateToAdd.toLocaleString(),
            Year: dateToAdd.getFullYear(),
            Month: dateToAdd.getMonth() + 1,
            Day: dateToAdd.getDay(),
            Hour: dateToAdd.getHours(),
            Minute: dateToAdd.getMinutes(),
            Type: currentlyAskedQuestionKey,
            Value: userValue
        };
        sheet.addRow(row, function (error, row) {
            // TODO: replace with editing the existing message (ID in currentlyAskedQuestionMessageId, however couldn't get it to work)
            ctx.reply("Success ✅", Extra.inReplyTo(currentlyAskedQuestionMessageId));
        });
    });
    // As we get no benefit of using `bot.command` to add commands, we might as well use
    // regexes, which then allows us to let the user's JSON define the available commands
    bot.hears(/\/(\w+)/, function (ctx) {
        console.log(ctx);
        // user entered a command to start the survey
        var command = ctx.match[1];
        if (command == "awake") {
            // Looks like Telegram has some limitations:
            // - No way to use `force_reply` together with a custom keyboard (https://github.com/KrauseFx/FxLifeSheet/issues/5)
            // - No way to update existing messages together with a custom keyboard https://core.telegram.org/bots/api#updating-messages
            ctx
                .reply("How well did you sleep today?", Markup.keyboard([["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"]])
                .oneTime()
                .extra())
                .then(function (_a) {
                var message_id = _a.message_id;
                currentlyAskedQuestionMessageId = message_id;
            });
            currentlyAskedQuestionKey = "sleepQuality";
        }
    });
    bot.start(function (ctx) { return ctx.reply("Welcome to FxLifeSheet"); });
    bot.help(function (ctx) { return ctx.reply("TODO: This will include the help section"); });
    bot.on("sticker", function (ctx) { return ctx.reply("Sorry, I don't support stickers"); });
    bot.hears("hi", function (ctx) { return ctx.reply("Hey there"); });
    // has to be last
    bot.launch();
}
