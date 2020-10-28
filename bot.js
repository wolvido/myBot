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

// creating array of hours:minutes to recognize time format
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
    console.log("target: "+deadline);
	let date = new Date;
    let minutes = date.getMinutes();
    console.log("current min: "+minutes);
    let hour = date.getHours();
    console.log("current hour: "+ hour);
    let currentMinutes = (hour*60) + minutes;
    console.log("current total minutes: "+ currentMinutes);
    let currentTime = (currentMinutes*60)*1000;
    console.log("current time converted total: "+ currentTime)

    if (str.charAt(0) == '0' ) {
        var hourStr = str.substring(0,2);
        var minuteStr = str.substring(3,5);
      }else{
        var hourStr = str.substring(0,1);
        var minuteStr = str.substring(2,5);
      }
    
    console.log("hour input: "+hourStr);
    console.log("minutes input: "+minuteStr);
    let convertToMinutes = (parseInt(hourStr)*60) + parseInt(minuteStr);
    console.log("total minutes input: "+minuteStr);
    let deadlineConvert = (convertToMinutes*60)*1000;
    console.log("deadlineConvert input: "+deadlineConvert);
  
    let alarmTime = deadlineConvert - currentTime;
    console.log("total countdown: "+ (alarmTime/1000)+"seconds");
  
	return alarmTime;
};

//DIALOG TEST
const TEST_DIALOG = 'my-dialog-name-constant';
let convo = new BotkitConversation(TEST_DIALOG, controller);
   // send a greeting
convo.say('Howdy!');

// ask a question, store the response in 'name'
convo.ask('What is your name?', async(response, convo, bot) => {
    console.log(`user name is ${ response }`);
    // do something?
}, 'name');

// use add action to switch to a different thread, defined below...
convo.addAction('favorite_color');

// add a message and a prompt to a new thread called `favorite_color`
convo.addMessage('Awesome {{vars.name}}!', 'favorite_color');
convo.addQuestion('Now, what is your favorite color?', async(response, convo, bot) => {
    console.log(`user favorite color is ${ response }`);
},'color', 'favorite_color');

// go to a confirmation
convo.addAction('confirmation' ,'favorite_color');

// do a simple conditional branch looking for user to say "no"
convo.addQuestion('Your name is {{vars.name}} and your favorite color is {{vars.color}}. Is that right?', [
    {
        pattern: 'no',
        handler: async(response, convo, bot) => {
            // if user says no, go back to favorite color.
            await convo.gotoThread('favorite_color');
        }
    },
    {
        default: true,
        handler: async(response, convo, bot) => {
            // do nothing, allow convo to complete.
        }
    }
], 'confirm', 'confirmation');
///////////////////////////////////////////////

//dialog for schedule
const ALARM_DIALOG = 'my-dialog-name';
let alarmConvo = new BotkitConversation(ALARM_DIALOG, controller);
alarmConvo.ask('ok what would you call this task?', async(response, convo, bot) => {
    console.log(`task name is ${ response }`);
    //it worked
    task = response;
}, 'taskName');
alarmConvo.say('using 24-hour format, what time would you like to start?');

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    controller.addDialog(alarmConvo);
    controller.hears(['Schedule a task','schedule','Schedule a task for today'], ['message'], async(bot, message) => {
        await bot.beginDialog(ALARM_DIALOG);
    });

    controller.addDialog(convo);
    controller.hears('test', 'message', async(bot, message) => {
        await bot.beginDialog(TEST_DIALOG);
    });

    controller.hears(['hi','hello','howdy','hey','aloha','hola','bonjour','oi'],['message'], async (bot,message) => {
        let items = ['hi','hello','howdy','hey','aloha','hola','bonjour','oi'];
        let randomHey = items[Math.floor(Math.random() * items.length)]; 
        await bot.reply(message,randomHey);
    });

    controller.hears(hourMinutes,['message'], async(bot, message) => {
        //alarm
        await bot.reply(message,`you will be reminded on ${ message.text } for ${ task }`);
        controller.trigger('alarm', bot, message);
        //
    });

    //alarm
    controller.on('alarm', async(bot, message) => {
        await bot.changeContext(message.reference)
        setTimeout(() => bot.reply(message, `it's ${message.text}`), timeOutAlarm(message.text))
        setTimeout(() => bot.reply(message, `time for ${ task} `), timeOutAlarm(message.text)+1000)
        setTimeout(() => bot.reply(message, `inform me when your done doing ${ task} `), (timeOutAlarm(message.text)+3000))
       });
    //

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





