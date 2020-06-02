litenBotGlobalParserByl = function(_master) {
    var self = new litenBotGlobalParser(_master);

    //  родительские переменные модуля
    self.apiname = "парс";
    self.name = "Liten bot: global parser (Bylins mud)";
    self.version = "1.0";
    self.description = "Глобальный парсер для Былин.";
    self.author = "Литьен";

    //  собственные переменные

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {

        //  состояние
        self.registerParser(/^(\d+)H (\d+)M (\d+)о .+ (\d+)G (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, "Состояние");
        self.registerParser(/^(\d+)H (\d+)M (\d+)о (.+)/, self.psFightPrompt, false, self.parseMode.ALWAYS, "СтатусБитвы");
        self.registerParser(/сражается с ВАМИ!/, self.psFightWithYou, false, self.parseMode.ALWAYS, "СражаетсяСВами");
        self.registerParser(/(.+) душа медленно подымается в небеса./, self.psMobRIP, false, self.parseMode.ALWAYS, "РИП");


        //  ошибки
        self.registerParser(/^Вы не видите цели./, self.psNoAtackMobError, false, self.parseMode.ALWAYS, "ОшибкаНетМобаАгро");

        //  другие методы вызываемые при создании модуля
        var group = "";
        //  room
        group = "Комната";
        self.registerParser(/^(\d+)H (\d+)M (\d+)о .+ (\d+)G (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, group);
        self.registerParser(/^\u001b\[1;33m(.+)/, self.psItemsStart, true, self.parseMode.DESCEND, group);
        self.registerParser(/^\u001b\[1;33m\u001b\[1;31m(.+)/, self.psMobsStart, true, self.parseMode.ITEMS, group);

        //  вызов родительского конструктора
        parentConstructor();
    }
    //  парсинг строки состояния боя
    var parent_psFightPrompt = self.psFightPrompt;
    self.psFightPrompt = function(_hp, _mv, _exp, _other) {
        self.setMode(self.parseMode.REGULAR);
        parent_psFightPrompt(_hp, 0, _mv, _exp, "", undefined, _other);
    }

    //  парсинг строки состояния
    var parent_psPrompt = self.psPrompt;
    self.psPrompt = function(_hp, _mv, _exp, _coin, _other) {
        parent_psPrompt(_hp, 0, _mv, _exp, "", _coin, _other);
    }

    //  вызов констурктор
    self.constructor()

    return self;
}