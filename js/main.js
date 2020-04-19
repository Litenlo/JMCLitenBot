include("js/absMobule.js");
include("js/litenBotMain.js");
include("js/litenBotTimers.js");
include("js/litenBotPrayBot.js");

newbot = new litenBotMain();

timers = new litenBotTimers(newbot);
praybot = new litenBotPrayBot(newbot);

//newbot.addModule(timers);
//newbot.addModule(praybot);
// register timer event
jmc.RegisterHandler("Timer", "timers.onTimer()");

// register user / jmc input event
jmc.RegisterHandler("Input", "newbot.onInput()");

// register income text event
jmc.RegisterHandler("Incoming", "newbot.onIncoming()");