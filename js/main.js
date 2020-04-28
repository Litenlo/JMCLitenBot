include("js/absMobule.js");
include("js/litenBotMain.js");
include("js/litenBotGlobalParser.js");
include("js/litenBotTimers.js");
include("js/litenBotPrayBot.js");
include("js/litenBotScenario.js");

newbot = new litenBotMain();

parser = new litenBotGlobalParser(newbot);
timers = new litenBotTimers(newbot);
praybot = new litenBotPrayBot(newbot);
scenario = new litenBotScenario(newbot);

// register timer event
jmc.RegisterHandler("Timer", "timers.onTimer()");

// register user / jmc input event
jmc.RegisterHandler("Input", "newbot.onInput()");

// register income text event
jmc.RegisterHandler("Incoming", "newbot.onIncoming()");