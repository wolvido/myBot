//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the jocko bot.

// Import Botkit's core features
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');
const { BotkitConversation } = require('botkit');

// Import a platform-specific adapter for web.

const { WebAdapter } = require('botbuilder-adapter-web');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
    });
}

const adapter = new WebAdapter({});


const controller = new Botkit({
    webhook_uri: '/api/messages',

    adapter: adapter,

    storage
});

if (process.env.CMS_URI) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN,
    }));
}

// creating array of hours:minutes for alarm
var array = [], i, j;
for(i=0; i<24; i++) {
  for(j=0; j<60; j++) {
    array.push(i + ":" + (j===0 ? "00" : 1*j) );
  }
}
var array2 = [], i, j;
for(i=0; i<10; i++) {
  for(j=0; j<10; j++) {
    array2.push( '0' + i + ":" + 0 +j );
  }
}
var hourMinutes = array.concat(array2)
//

//convert deadline into remaining time in milliseconds
function timeOutAlarm(deadline){
	let str = deadline;
	let date = new Date;
	let minutes = date.getMinutes();
	let hour = date.getHours();
	let currentMinutes = (hour*60) + minutes;
	let currentTime = (currentMinutes*60)*1000;
  
	let hourStr = str.substring(0,2);
	let minuteStr = str.substring(3,5);
	let convertToMinutes = (parseInt(hourStr)*60) + parseInt(minuteStr);
	let deadlineConvert = (convertToMinutes*60)*1000;
  
	let alarmTime = deadlineConvert - currentTime;
  
	return alarmTime;
}
//


// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {


////////////////

///////////


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

    controller.hears(['hi','hello','howdy','hey','aloha','hola','bonjour','oi'],['message'], async (bot,message) => {   
        await bot.reply(message,'Oh hai!');
    });

    controller.hears(hourMinutes,['message'], async(bot, message) => {
        //this shit works
        controller.trigger('alarm', bot, message);
        //yes
    });


    ///////this shit works
    controller.on('alarm', async(bot, message) => {
        await bot.changeContext(message.reference)
        setTimeout(() => bot.reply(message, `works ${ message.text }`), timeOutAlarm(message.text))
       });
    ///////////yes

    


    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);
            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

});





