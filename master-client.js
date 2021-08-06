/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="app.ts"/> 
// Game logic runs on one of the conected clients - master client~
// Server Lua Extension Scripts port (see demo-pairs)
// map and mapProgress arrays start for 1 because of lua origial source (and may be compatibility)
var GameProperties = {};
var MasterClient = /** @class */ (function () {
    // private flushPropsFlag = false; // set this flag to send props update
    // private game: any; // room property copy for modification and update (persistent game state)
    // private state: any; // room property copy for modification and update (state to reset after game load)
    function MasterClient(client) {
        this.client = client;
        this.logger = new Exitgames.Common.Logger("MC:", Exitgames.Common.Logger.Level.DEBUG);
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
    MasterClient.prototype.onJoinRoom = function () {
        if (!this.isMaster())
            return;
        this.logger.debug("onJoinRoom");
    };
    MasterClient.prototype.onActorJoin = function (actor) {
        if (!this.isMaster())
            return;
        this.logger.debug("onActorJoin", actor.actorNr);
    };
    MasterClient.prototype.onActorLeave = function (actor) {
        if (!this.isMaster())
            return;
        this.logger.debug("onActorLeave", actor.actorNr);
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
        // var returning = false;
        // for (var i in this.game.players) {
        //     var iid = this.game.players[i];
        //     if (id == iid) {
        //         returning = true;
        //         break;
        //     }
        // }
        // if (!returning) {
        //     this.logger.info("Player ", id, " added to game")
        // 	this.game.players.push(id);
        //     this.GamePlayerDataInit(id, actorInfo);
        // }
        // else {
        //     this.logger.info("Player ", id, " returned to game");
        //     this.GamePlayerDataUpdate(id, actorInfo);
        // }
        // this.flushPropsFlag = true;
    };
    MasterClient.prototype.onEvent = function (code, content, actorNr) {
        if (!this.isMaster())
            return;
        // this.cacheProps();
        switch (code) {
            case DemoConstants.EvNewGame:
                this.OnNewGameEvent(actorNr, code, content);
                break;
        }
        // this.flushProps();
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
        // var trivial = data && data.trivial;
        var players = new Array();
        var observers = [];
        for (var a in actors) {
            if (actors[a].getParticipation() == 2) {
                actors[a].setParticipation(1);
                players.push(actors[a].actorNr);
                continue;
            }
            if (actors[a].getParticipation() == 1) {
                players.push(actors[a].actorNr);
                continue;
            }
            if (actors[a].getParticipation() == 0) {
                observers.push(actors[a].actorNr);
            }
        }
        this.broadcast(DemoConstants.EvUpdatePlayers, null);
        this.InitGame(players);
        for (var i in observers) {
            var anr = observers[i];
            this.broadcast(DemoConstants.EvBeginObserver, null, { targetActors: [anr] });
        }
    };
    MasterClient.prototype.InitGame = function (players) {
        Output.log('initgame');
        var acqnum = {};
        var decknum = {};
        for (var i in players) {
            var Nr = players[i];
            Output.log('player' + String(Nr));
            acqnum[Nr] = 0;
            decknum[Nr] = 7;
        }
        this.client.myRoom().setCustomProperty('acqnum', acqnum);
        this.client.myRoom().setCustomProperty('decksize', decknum);
        this.client.myRoom().emptyFieldCards(players);
        this.ShuffleCards(players);
        // this.logger.info("Game Init")
        // var prevPlayersData = this.game && this.game.playersData || {};
        // this.game = {};
        // this.state = {};
        // this.game.id = "TheOnlyGame";
        // this.game.players = players || new Array<number>();
        // this.game.playersData = {};
        // for (var i in this.game.players) {
        //     var id = this.game.players[i];
        //     this.GamePlayerDataInit(id, prevPlayersData[id]);
        // }
        // this.game.moveCount = 0;
        // this.flushPropsFlag = true;
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
    return MasterClient;
}());
