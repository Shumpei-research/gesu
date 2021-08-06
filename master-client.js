/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="app.ts"/> 
// Game logic runs on one of the conected clients - master client~
// Server Lua Extension Scripts port (see demo-pairs)
// map and mapProgress arrays start for 1 because of lua origial source (and may be compatibility)
var GameProperties = {
    variety: 8,
    columnCount: 4,
    cardShowTimeout: 1000,
    moveTimeoutSec: 10,
    cardtext: 'resources/cards.json',
    icons: [
        "resources/game-icons/angler-fish.png",
        "resources/game-icons/crown.png",
        "resources/game-icons/drink-me.png",
        "resources/game-icons/fishbone.png",
        "resources/game-icons/glass-heart.png",
        "resources/game-icons/horse-head.png",
        "resources/game-icons/robe.png",
        "resources/game-icons/rocket.png",
    ]
};
var MasterClient = /** @class */ (function () {
    function MasterClient(client) {
        this.client = client;
        this.logger = new Exitgames.Common.Logger("MC:", Exitgames.Common.Logger.Level.DEBUG);
        this.flushPropsFlag = false; // set this flag to send props update
        this.shuffled = {};
        this.logger.info("Created");
    }
    // Master is client with smallest actorNr
    // TODO: cache it and update only on changes
    MasterClient.prototype.isMaster = function () {
        var myActorNr = this.client.myActor().actorNr;
        for (var i in this.client.myRoomActors()) {
            if (parseInt(i) < myActorNr) {
                return false;
            }
        }
        return true;
    };
    // sends to all including itself
    MasterClient.prototype.broadcast = function (eventCode, data, options) {
        this.logger.debug("broadcast", eventCode);
        this.client.raiseEventAll(eventCode, data, options);
    };
    MasterClient.prototype.cacheProps = function () {
        var room = this.client.myRoom();
        this.flushPropsFlag = false;
        this.game = room.getCustomProperty("game");
        this.state = room.getCustomProperty("state") || {};
        this.state = this.state || {};
        if (this.game) {
            this.game.players = this.game.players || new Array();
            this.game.playersData = this.game.playersData || {};
            this.game.mapProgress = this.game.mapProgress || new Array();
        }
        //
    };
    MasterClient.prototype.flushProps = function () {
        if (this.state && Object.keys(this.state).length == 0)
            this.state = null;
        if (this.game) {
            if (Object.keys(this.game).length == 0)
                this.game = null;
            else {
                if (this.game.players && Object.keys(this.game.players).length == 0)
                    this.game.players = null;
                if (this.game.playersData && Object.keys(this.game.playersData).length == 0)
                    this.game.playersData = null;
                if (this.game.mapProgress && Object.keys(this.game.mapProgress).length == 0)
                    this.game.mapProgress = null;
            }
        }
        if (this.flushPropsFlag) {
            var room = this.client.myRoom();
            room.setCustomProperty("game", this.game);
            room.setCustomProperty("state", this.state);
        }
    };
    MasterClient.prototype.onJoinRoom = function () {
        if (!this.isMaster())
            return;
        this.logger.debug("onJoinRoom");
        this.cacheProps();
        if (!this.game) {
            this.logger.info("Creating new game...");
            this.InitGame();
        }
        // handle client's actor join same way as others
        this.onPlayerJoin(this.client.myActor());
        this.flushProps();
    };
    MasterClient.prototype.onActorJoin = function (actor) {
        if (!this.isMaster())
            return;
        this.logger.debug("onActorJoin", actor.actorNr);
        this.cacheProps();
        this.onPlayerJoin(actor);
        this.flushProps();
    };
    MasterClient.prototype.onActorLeave = function (actor) {
        if (!this.isMaster())
            return;
        this.logger.debug("onActorLeave", actor.actorNr);
        this.cacheProps();
        var room = this.client.myRoom();
        this.flushPropsFlag = false;
        this.flushProps();
    };
    MasterClient.prototype.onPlayerJoin = function (actor) {
        if (!this.isMaster())
            return;
        this.logger.debug("onPlayerJoin", actor.actorNr);
        var actorInfo = { name: actor.getCustomProperty("name") };
        var id = actor.getCustomProperty("name");
        var actors = this.client.myRoomActors();
        // for (var n in actors) {
        //     var a = actors[n];
        //     if (a.actorNr !== actor.actorNr && a.getCustomProperty("name") === id) {
        //         var msg = "Player " + id + " already connected";
        //         this.broadcast(DemoConstants.EvDisconnectOnAlreadyConnected, null, { targetActors: [actor.actorNr] });
        //         this.logger.info("onPlayerJoin", msg);
        //         return;
        //     }
        // }
        // TODO: player load
        var returning = false;
        for (var i in this.game.players) {
            var iid = this.game.players[i];
            if (id == iid) {
                returning = true;
                break;
            }
        }
        if (!returning) {
            this.logger.info("Player ", id, " added to game");
            this.game.players.push(id);
            this.GamePlayerDataInit(id, actorInfo);
        }
        else {
            this.logger.info("Player ", id, " returned to game");
            this.GamePlayerDataUpdate(id, actorInfo);
        }
        this.flushPropsFlag = true;
    };
    MasterClient.prototype.onEvent = function (code, content, actorNr) {
        if (!this.isMaster())
            return;
        this.cacheProps();
        switch (code) {
            case DemoConstants.EvNewGame:
                this.OnNewGameEvent(actorNr, code, content);
                break;
        }
        this.flushProps();
    };
    MasterClient.prototype.onStateChange = function (state) {
        if (!this.isMaster())
            return;
    };
    MasterClient.prototype.onOperationResponse = function (errorCode, errorMsg, code, content) {
        if (!this.isMaster())
            return;
    };
    MasterClient.prototype.OnNewGameEvent = function (actorNr, evCode, data) {
        var actors = this.client.myRoomActors();
        var trivial = data && data.trivial;
        var players = new Array();
        for (var a in actors) {
            if (actors[a].getParticipation() == 2) {
                actors[a].setParticipation(1);
            }
            if (actors[a].getParticipation() == 1) {
                players.push(actors[a].actorNr);
            }
        }
        this.InitGame(players);
    };
    MasterClient.prototype.InitGame = function (players) {
        var acqnum = {};
        var decknum = {};
        for (var i in players) {
            var Nr = players[i];
            Output.log('player' + String(Nr));
            acqnum[Nr] = 0;
            decknum[Nr] = 0;
        }
        this.client.myRoom().setCustomProperty('acqnum', acqnum);
        this.client.myRoom().initializeDeckSize();
        this.client.myRoom().setCustomProperty('decknum', decknum);
        this.ShuffleCards(players);
        this.logger.info("Game Init");
        var prevPlayersData = this.game && this.game.playersData || {};
        this.game = {};
        this.state = {};
        this.game.id = "TheOnlyGame";
        this.game.players = players || new Array();
        this.game.playersData = {};
        for (var i in this.game.players) {
            var id = this.game.players[i];
            this.GamePlayerDataInit(id, prevPlayersData[id]);
        }
        this.game.moveCount = 0;
        this.flushPropsFlag = true;
    };
    MasterClient.prototype.ShuffleCards = function (players) {
        var cardnum = this.client.myRoom().cards.length;
        function shuffle(num) {
            var _a;
            var array = [];
            for (var i = 0; i < num; ++i) {
                array.push(i);
            }
            var currentIndex = num;
            var randomIndex = num;
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                // And swap it with the current element.
                _a = [
                    array[randomIndex], array[currentIndex]
                ], array[currentIndex] = _a[0], array[randomIndex] = _a[1];
            }
            return array;
        }
        var allsh = shuffle(cardnum);
        for (var i in players) {
            var j = parseInt(i);
            var anr = players[i];
            this.shuffled[anr] = allsh.slice(7 * j, 7 * (j + 1));
            this.broadcast(DemoConstants.EvDistributeCards, this.shuffled[anr], { targetActors: [anr] });
        }
    };
    MasterClient.prototype.GamePlayerDataInit = function (id, data) {
        this.game.playersData[id] = {
            id: id, name: data && data.name,
            hitCount: 0,
            missCount: 0
        };
    };
    MasterClient.prototype.GamePlayerDataUpdate = function (id, data) {
        this.game.playersData[id].name = data && data.name;
    };
    return MasterClient;
}());
