module.exports = function(controller) {

    controller.on('hello', hello);
    async function hello(bot, message) {
    await bot.reply(message,"hello there!"
    );
    }

    controller.on('welcome_back', welcome_back);
    async function welcome_back(bot, message) {
    await bot.reply(message,"welcome back!"
    );
    }

}