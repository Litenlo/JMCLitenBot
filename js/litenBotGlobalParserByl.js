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

        //  вызов родительского конструктора
        parentConstructor();

        //  состояние
        self.registerParser(/^(\d+)H (\d+)M (\d+)о .+ (\d+)G (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, "Состояние");
        self.registerParser(/^(\d+)H (\d+)M (\d+)о .+ (\d+)G (.+)/, self.psFightPrompt, false, self.parseMode.ALWAYS, "СтатусБитвы");

        //  другие методы вызываемые при создании модуля
        var group = "";
        //  room
        group = "Комната";
        self.registerParser(/^(\d+)H (\d+)M (\d+)о .+ (\d+)G (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, group);
        self.registerParser(/^\u001b\[1;33m\u001b\[1;31m(.+)/, self.psMobsStart, true, self.parseMode.ITEMS, group);
    }
    //  парсинг строки состояния боя
    var parent_psFightPrompt = self.psPrompt;
    self.psFightPrompt = function(_hp, _mv, _exp, _coin, _other) {
        parent_psFightPrompt(_hp, 0, _mv, _exp, "", _coin, _other);
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