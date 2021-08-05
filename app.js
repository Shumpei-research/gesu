/// <reference path="3rdparty/easeljs.d.ts" />          
/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="master-client.ts"/> 
/// <reference path="cards.ts"/> 
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// For Photon Cloud Application access create cloud-app-info.js file in the root directory (next to default.html) and place next lines in it:
//var AppInfo = {
//    AppId: "your app id",
//    AppVersion: "your app version",
//}
// fetching app info global variable while in global context
var DemoWss = this["AppInfo"] && this["AppInfo"]["Wss"];
var DemoAppId = this["AppInfo"] && this["AppInfo"]["AppId"] ? this["AppInfo"]["AppId"] : "<no-app-id>";
var DemoAppVersion = this["AppInfo"] && this["AppInfo"]["AppVersion"] ? this["AppInfo"]["AppVersion"] : "1.0";
var DemoFbAppId = this["AppInfo"] && this["AppInfo"]["FbAppId"];
var DemoConstants = {
    EvClick: 1,
    //    EvGetMap: 2, // for debug only
    //    EvGetMapProgress: 3,
    EvNewGame: 4,
    MasterEventMax: 100,
    EvGameStateUpdate: 101,
    EvPlayersUpdate: 102,
    EvGameMap: 103,
    EvClickDebug: 104,
    EvDistributeCards: 201,
    EvShowCards: 105,
    EvHideCards: 106,
    //    EvGameMapProgress: 107,
    EvMoveTimer: 108,
    EvDisconnectOnAlreadyConnected: 151,
    GameStateProp: "gameState",
    MoveCountProp: "moveCount",
    LogLevel: Exitgames.Common.Logger.Level.DEBUG
};
var CardVisual = /** @class */ (function (_super) {
    __extends(CardVisual, _super);
    function CardVisual() {
        var _this = _super.call(this) || this;
        _this.shape = new createjs.Shape();
        _this.text = new createjs.Text('', '12px Arial', 'black');
        _this.shape.graphics.beginStroke('black').beginFill('white');
        _this.shape.graphics.drawRoundRect(0, 0, 100, 40, 10);
        _this.text.textAlign = 'center';
        _this.text.textBaseline = 'middle';
        _this.text.maxWidth = 90;
        _this.text.x = 50;
        _this.text.y = 20;
        _this.addChild(_this.shape);
        _this.addChild(_this.text);
        return _this;
    }
    CardVisual.prototype.showcard = function (newtext) {
        this.text.text = newtext;
        this.visible = true;
    };
    CardVisual.prototype.hidecard = function () {
        this.visible = false;
    };
    return CardVisual;
}(createjs.Container));
var CardSetVisual = /** @class */ (function (_super) {
    __extends(CardSetVisual, _super);
    function CardSetVisual() {
        var _this = _super.call(this) || this;
        _this.cardnum = 7;
        _this.cards = [];
        for (var i = 0; i < _this.cardnum; ++i) {
            _this.cards[i] = new CardVisual();
            _this.cards[i].y = i * 45;
            _this.addChild(_this.cards[i]);
        }
        _this.hideall();
        return _this;
    }
    CardSetVisual.prototype.getcard = function (i) {
        return this.cards[i];
    };
    CardSetVisual.prototype.hideall = function () {
        for (var i = 0; i < this.cardnum; ++i) {
            this.getcard(i).hidecard();
        }
    };
    CardSetVisual.prototype.showcard = function (i, s) {
        this.getcard(i).showcard(s);
    };
    return CardSetVisual;
}(createjs.Container));
var DeckVisual = /** @class */ (function (_super) {
    __extends(DeckVisual, _super);
    function DeckVisual() {
        var _this = _super.call(this) || this;
        _this.shape = new createjs.Shape();
        _this.numtext = new createjs.Text('', '20px Arial', 'black');
        _this.shape.graphics.beginStroke('black').beginFill('white');
        _this.shape.graphics.drawRoundRect(0, 0, 30, 40, 10);
        _this.numtext.textAlign = 'center';
        _this.numtext.textBaseline = 'middle';
        _this.numtext.maxWidth = 25;
        _this.numtext.x = 15;
        _this.numtext.y = 20;
        _this.addChild(_this.shape);
        _this.addChild(_this.numtext);
        return _this;
    }
    DeckVisual.prototype.setnum = function (i) {
        this.numtext.text = String(i);
    };
    return DeckVisual;
}(createjs.Container));
var PlayerVisual = /** @class */ (function (_super) {
    __extends(PlayerVisual, _super);
    function PlayerVisual() {
        var _this = _super.call(this) || this;
        _this.playername = new createjs.Text('name', '12px Arial', 'black');
        _this.decknum = new DeckVisual();
        _this.showncards = new CardSetVisual();
        _this.playername.textAlign = 'center';
        _this.playername.textBaseline = 'middle';
        _this.playername.maxWidth = 100;
        _this.playername.x = 50;
        _this.playername.y = 10;
        _this.addChild(_this.playername);
        _this.decknum.x = 35;
        _this.decknum.y = 20;
        _this.addChild(_this.decknum);
        _this.showncards.y = 70;
        _this.addChild(_this.showncards);
        return _this;
    }
    return PlayerVisual;
}(createjs.Container));
var PlayerSetVisual = /** @class */ (function (_super) {
    __extends(PlayerSetVisual, _super);
    function PlayerSetVisual(Nrs) {
        var _this = _super.call(this) || this;
        _this.players = {};
        for (var i = 0; i < Nrs.length; ++i) {
            var oneNr = Nrs[i];
            _this.players[oneNr] = new PlayerVisual();
            _this.players[oneNr].x = i * 110;
            _this.addChild(_this.players[oneNr]);
        }
        return _this;
    }
    PlayerSetVisual.prototype.getplayervisual = function (Nr) {
        return this.players[Nr];
    };
    return PlayerSetVisual;
}(createjs.Container));
var ButtonVisual = /** @class */ (function (_super) {
    __extends(ButtonVisual, _super);
    function ButtonVisual(labeltext) {
        var _this = _super.call(this) || this;
        _this.shape = new createjs.Shape();
        _this.label = new createjs.Text('acquire', '12px Arial', 'black');
        _this.shape.graphics.beginStroke('black').beginFill('white').drawRoundRect(0, 0, 60, 20, 10);
        _this.label.text = labeltext;
        _this.label.textAlign = 'center';
        _this.label.textBaseline = 'middle';
        _this.label.x = 30;
        _this.label.y = 10;
        _this.addChild(_this.shape);
        _this.addChild(_this.label);
        return _this;
    }
    return ButtonVisual;
}(createjs.Container));
var Demo = /** @class */ (function (_super) {
    __extends(Demo, _super);
    function Demo(canvas) {
        var _this = _super.call(this, DemoWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, DemoAppId, DemoAppVersion) || this;
        _this.canvas = canvas;
        _this.useGroups = false;
        _this.automove = false;
        _this.deckindex = [];
        _this.editorindex = [];
        _this.fieldindex = [];
        _this.logger = new Exitgames.Common.Logger("Demo:", DemoConstants.LogLevel);
        _this.autoClickTimer = 0;
        _this.cellWidth = 96;
        _this.cellHeight = 96;
        _this.bgColor = 'rgba(220,220,220,255)';
        _this.shownCards = [];
        _this.masterClient = new MasterClient(_this);
        // uncomment to use Custom Authentication
        // this.setCustomAuthentication("username=" + "yes" + "&token=" + "yes");
        Output.log(String(DemoWss));
        var addr = _this.getNameServerAddress();
        Output.log("Init", addr, DemoAppId, DemoAppVersion);
        _this.logger.info("Init", DemoAppId, DemoAppVersion);
        _this.setLogLevel(DemoConstants.LogLevel);
        return _this;
    }
    // sends to all including itself
    Demo.prototype.raiseEventAll = function (eventCode, data, options) {
        options = options || {};
        options.receivers = Photon.LoadBalancing.Constants.ReceiverGroup.All;
        this.raiseEvent(eventCode, data, options);
    };
    // overrides
    Demo.prototype.roomFactory = function (name) { return new DemoRoom(this, name); };
    Demo.prototype.actorFactory = function (name, actorNr, isLocal) { return new DemoPlayer(this, name, actorNr, isLocal); };
    Demo.prototype.myRoom = function () { return _super.prototype.myRoom.call(this); };
    Demo.prototype.myActor = function () { return _super.prototype.myActor.call(this); };
    Demo.prototype.myRoomActors = function () { return _super.prototype.myRoomActors.call(this); };
    Demo.prototype.start = function () {
        this.stage = new createjs.Stage(this.canvas);
        this.setupUI();
        this.myRoom().loadResources(this.stage);
        //        this.connectToRegionMaster("EU");
    };
    // overrides
    Demo.prototype.onError = function (errorCode, errorMsg) {
        Output.log("Error", errorCode, errorMsg);
        // optional super call
        _super.prototype.onError.call(this, errorCode, errorMsg);
    };
    Demo.prototype.onOperationResponse = function (errorCode, errorMsg, code, content) {
        this.masterClient.onOperationResponse(errorCode, errorMsg, code, content);
        if (errorCode) {
            switch (code) {
                case Photon.LoadBalancing.Constants.OperationCode.JoinRandomGame:
                    switch (errorCode) {
                        case Photon.LoadBalancing.Constants.ErrorCode.NoRandomMatchFound:
                            Output.log("Join Random:", errorMsg);
                            this.createDemoRoom();
                            break;
                        default:
                            Output.log("Join Random:", errorMsg);
                            break;
                    }
                    break;
                case Photon.LoadBalancing.Constants.OperationCode.CreateGame:
                    if (errorCode != 0) {
                        Output.log("CreateGame:", errorMsg);
                        this.disconnect();
                    }
                    break;
                case Photon.LoadBalancing.Constants.OperationCode.JoinGame:
                    if (errorCode != 0) {
                        Output.log("CreateGame:", errorMsg);
                        this.disconnect();
                    }
                    break;
                default:
                    Output.log("Operation Response error:", errorCode, errorMsg, code, content);
                    break;
            }
        }
    };
    Demo.prototype.onEvent = function (code, content, actorNr) {
        this.masterClient.onEvent(code, content, actorNr);
        switch (code) {
            case DemoConstants.EvDisconnectOnAlreadyConnected:
                Output.log("Disconnected by Master Client as already connected player");
                this.disconnect();
                break;
            case DemoConstants.EvMoveTimer:
                var t = document.getElementById("info");
                t.textContent = "Your turn now! (" + content.timeout + " sec.)";
                break;
            case DemoConstants.EvClickDebug:
                Output.log(content.msg);
                break;
            case DemoConstants.EvDistributeCards:
                Output.log('distribute', content);
                this.deckindex = content;
                this.editorindex = [];
                this.fieldindex = [];
                this.updateCard();
            case DemoConstants.EvShowCards:
                Output.log("show ", content.cards);
                for (var c in content.cards) {
                    this.showCard(parseInt(c), content.cards[c]);
                }
                if (content.resetShown) {
                    var demo = this;
                    setTimeout(function () {
                        for (var c in content.resetShown.cards) {
                            demo.hideCard(parseInt(content.resetShown.cards[c]), true);
                        }
                        demo.stage.update();
                    }, GameProperties.cardShowTimeout);
                }
                this.stage.update();
                break;
            case DemoConstants.EvHideCards:
                Output.log("hide ", content.cards);
                if (content.all) {
                    for (var i = 1; i <= this.myRoom().variety * 2; ++i) {
                        this.hideCard(i);
                    }
                }
                for (var k in content.cards) {
                    this.hideCard(content.cards[k]);
                }
                this.stage.update();
                break;
            default:
        }
        this.logger.info("Demo: onEvent", code, "content:", content, "actor:", actorNr);
    };
    Demo.prototype.onStateChange = function (state) {
        this.masterClient.onStateChange(state);
        // "namespace" import for static members shorter acceess
        var LBC = Photon.LoadBalancing.LoadBalancingClient;
        var stateText = document.getElementById("statetxt");
        stateText.textContent = LBC.StateToName(state);
        switch (state) {
            case LBC.State.JoinedLobby:
                this.joinRandomRoom();
                break;
            default:
                break;
        }
        this.updateRoomButtons();
        var t = document.getElementById("info");
        t.textContent = "Not in Game";
        this.updateAutoplay(this);
    };
    Demo.prototype.updateAutoplay = function (client) {
        clearInterval(this.autoClickTimer);
        var t = document.getElementById("autoplay");
        if (this.isConnectedToGame() && t.checked) {
            this.autoClickTimer = setInterval(function () {
                var hidden = [];
                var j = 0;
                for (var i = 1; i <= client.myRoom().variety * 2; ++i) {
                    if (!client.shownCards[i]) {
                        hidden[j] = i;
                        ++j;
                    }
                }
                if (hidden.length > 0) {
                    var card = hidden[Math.floor(Math.random() * hidden.length)];
                    client.raiseEventAll(DemoConstants.EvClick, { "card": card });
                }
            }, 750);
        }
    };
    Demo.prototype.updateMasterClientMark = function () {
        var el = document.getElementById("masterclientmark");
        el.textContent = this.masterClient.isMaster() ? "!" : "";
    };
    Demo.prototype.onRoomListUpdate = function (rooms, roomsUpdated, roomsAdded, roomsRemoved) {
        //        Output.log("onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.updateRoomButtons(); // join btn state can be changed
    };
    Demo.prototype.onRoomList = function (rooms) {
        this.updateRoomButtons();
    };
    Demo.prototype.onJoinRoom = function () {
        this.updateMasterClientMark();
        this.masterClient.onJoinRoom();
        this.logger.info("onJoinRoom myRoom", this.myRoom());
        this.logger.info("onJoinRoom myActor", this.myActor());
        this.logger.info("onJoinRoom myRoomActors", this.myRoomActors());
        this.updatePlayerOnlineList();
        // this.setupScene();
        var game = this.myRoom().getCustomProperty("game");
        for (var card = 1; card <= this.myRoom().variety * 2; ++card) {
            // TODO: remove game.mapProgress check after empty object send bug fix
            var icon = game.mapProgress && game.mapProgress[card];
            if (icon) {
                this.showCard(card, icon);
            }
        }
        this.stage.update();
    };
    Demo.prototype.onActorJoin = function (actor) {
        this.updateMasterClientMark();
        this.masterClient.onActorJoin(actor);
        Output.log("actor " + actor.actorNr + " joined");
        this.updatePlayerOnlineList();
    };
    Demo.prototype.onActorLeave = function (actor) {
        this.updateMasterClientMark();
        this.masterClient.onActorLeave(actor);
        Output.log("actor " + actor.actorNr + " left");
        this.updatePlayerOnlineList();
    };
    // tools
    Demo.prototype.createDemoRoom = function () {
        Output.log("New Game");
        this.myRoom().setEmptyRoomLiveTime(10000);
        this.createRoomFromMy("DemoPairsGame (Master Client)");
    };
    // private gridColor = 'rgba(180,180,180,255)';
    Demo.prototype.setupScene = function () {
        this.shownCards = [];
        this.stage.removeAllChildren();
        this.canvas.width = 700;
        this.canvas.height = 420;
        this.drawBg();
        this.drawGrid();
        this.setupSceneUI();
        this.stage.update();
    };
    Demo.prototype.hideCard = function (card, checkMap) {
        var game = this.myRoom().getCustomProperty("game");
        // TODO: remove game.mapProgress check after empty object send bug fix
        if (checkMap && game.mapProgress && game.mapProgress[card]) {
            // leave it open
        }
        else {
            if (this.shownCards[card]) {
                this.stage.removeChild(this.shownCards[card]);
                this.shownCards[card] = null;
            }
        }
    };
    Demo.prototype.showCard = function (card, icon) {
        if (!this.shownCards[card]) {
            var img = this.myRoom().icon(icon - 1);
            var bitmap = new createjs.Bitmap(img);
            var col = this.myRoom().columnCount;
            bitmap.x = ((card - 1) % col) * this.cellWidth;
            bitmap.y = Math.floor((card - 1) / col) * this.cellHeight;
            this.stage.addChild(bitmap);
            this.shownCards[card] = bitmap;
        }
    };
    Demo.prototype.updateCard = function () {
        this.mydeck.hideall();
        var card;
        for (var i = 0; i < this.deckindex.length; ++i) {
            card = this.myRoom().card(this.deckindex[i]);
            this.mydeck.showcard(i, card);
        }
        for (var i = 0; i < this.editorindex.length; ++i) {
            card = this.myRoom().card(this.editorindex[i]);
            this.editfield.showcard(i, card);
        }
        this.stage.update();
    };
    Demo.prototype.drawBg = function () {
        var bg = new createjs.Shape();
        bg.graphics.beginFill(this.bgColor).drawRect(0, 0, this.canvas.width, this.canvas.height);
        this.stage.addChild(bg);
    };
    Demo.prototype.drawGrid = function () {
        var num = this.myRoomActorCount();
        var actors = this.myRoomActors();
        var actorNrs = [];
        for (var a in actors) {
            if (actors[a].getParticipation() != 1) {
                continue;
            }
            actorNrs.push(a);
            Output.log('actornr' + String(a));
        }
        this.mydeck = new CardSetVisual();
        this.mydeck.x = 0;
        this.mydeck.y = 70;
        this.editfield = new CardSetVisual();
        this.editfield.x = 110;
        this.editfield.y = 70;
        this.players = new PlayerSetVisual(actorNrs);
        this.players.x = 220;
        this.players.y = 0;
        this.show_btn = new ButtonVisual('show');
        this.show_btn.x = 110;
        this.show_btn.y = 395;
        this.acquire_btn = new ButtonVisual('acquire');
        this.acquire_btn.x = 220;
        this.acquire_btn.y = 395;
        this.stage.addChild(this.mydeck);
        this.stage.addChild(this.editfield);
        this.stage.addChild(this.players);
        this.stage.addChild(this.show_btn);
        this.stage.addChild(this.acquire_btn);
        this.updateCard();
    };
    Demo.prototype.ToEditor = function () { };
    Demo.prototype.setupSceneUI = function () {
        function funcyay(ev) {
            Output.log('show button clicked');
        }
        this.show_btn.addEventListener("click", funcyay);
    };
    // ui
    Demo.prototype.setupUI = function () {
        // this.stage.addEventListener("stagemousedown", (ev) => {
        //     var x = Math.floor(this.stage.mouseX / this.cellWidth);
        //     var y = Math.floor(this.stage.mouseY / this.cellHeight);
        //     this.raiseEventAll(DemoConstants.EvClick, { "card": x + y * this.myRoom().columnCount + 1 });
        var _this = this;
        //     this.stage.update();
        // })
        var cb = document.getElementById("autoplay");
        cb.onchange = function () { return _this.updateAutoplay(_this); };
        var btn = document.getElementById("connectbtn");
        btn.onclick = function (ev) {
            var n = document.getElementById("playername");
            //                this.myActor().setName(n.value);
            var id = "n:" + n.value;
            // clients set actors's id
            _this.myActor().setInfo(id, n.value);
            _this.myActor().setParticipation(2);
            _this.myActor().setCustomProperty("auth", { name: n.value });
            _this.connectToRegionMaster("US");
        };
        btn = document.getElementById("disconnectbtn");
        btn.onclick = function (ev) {
            _this.disconnect();
            return false;
        };
        btn = document.getElementById("newgame");
        btn.onclick = function (ev) {
            _this.raiseEventAll(DemoConstants.EvNewGame, null);
            return false;
        };
        btn = document.getElementById("newtrivial");
        btn.onclick = function (ev) {
            _this.raiseEventAll(DemoConstants.EvNewGame, { trivial: true });
            return false;
        };
        this.updateRoomButtons();
    };
    Demo.prototype.updatePlayerOnlineList = function () {
        var list = document.getElementById("playeronlinelist");
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        for (var i in this.myRoomActors()) {
            var a = this.myRoomActors()[i];
            var item = document.createElement("li");
            item.attributes["value"] = a.getName() + " /" + a.getId();
            item.textContent = a.getName() + " / " + a.getId() + " / " + a.actorNr;
            if (a.isLocal) {
                item.textContent = "-> " + item.textContent;
            }
            list.appendChild(item);
            this.logger.info("actor:", a);
        }
        this.setupScene();
    };
    Demo.prototype.updateRoomButtons = function () {
        var btn;
        var connected = this.state != Photon.LoadBalancing.LoadBalancingClient.State.Uninitialized && this.state != Photon.LoadBalancing.LoadBalancingClient.State.Disconnected;
        btn = document.getElementById("connectbtn");
        btn.disabled = connected;
        btn = document.getElementById("fblogin");
        btn.disabled = connected;
        btn.hidden = !DemoFbAppId;
        btn = document.getElementById("disconnectbtn");
        btn.disabled = !connected;
        btn = document.getElementById("newgame");
        btn.disabled = !this.isJoinedToRoom();
        btn = document.getElementById("newtrivial");
        btn.disabled = !this.isJoinedToRoom();
    };
    return Demo;
}(Photon.LoadBalancing.LoadBalancingClient));
var Output = /** @class */ (function () {
    function Output() {
    }
    Output.log = function (str) {
        var op = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            op[_i - 1] = arguments[_i];
        }
        var log = document.getElementById("log");
        var formatted = this.logger.formatArr(str, op);
        var newLine = document.createElement('div');
        newLine.textContent = formatted;
        log.appendChild(newLine);
        log.scrollTop = log.scrollHeight;
    };
    Output.logger = new Exitgames.Common.Logger();
    return Output;
}());
var DemoRoom = /** @class */ (function (_super) {
    __extends(DemoRoom, _super);
    function DemoRoom(demo, name) {
        var _this = _super.call(this, name) || this;
        _this.demo = demo;
        // acceess properties every time
        _this.variety = 0;
        _this.columnCount = 0;
        _this.iconUrls = {};
        _this.icons = {};
        _this.cardUrl = '';
        _this.cards = [];
        _this.variety = GameProperties.variety;
        _this.columnCount = GameProperties.columnCount;
        _this.iconUrls = GameProperties.icons;
        _this.cardUrl = GameProperties.cardtext;
        return _this;
    }
    DemoRoom.prototype.rowCount = function () {
        return Math.ceil(2 * this.variety / this.columnCount);
    };
    DemoRoom.prototype.iconUrl = function (i) {
        return this.iconUrls[i];
    };
    DemoRoom.prototype.icon = function (i) {
        return this.icons[i];
    };
    DemoRoom.prototype.card = function (i) {
        return this.cards[i];
    };
    DemoRoom.prototype.onPropertiesChange = function (changedCustomProps, byClient) {
        //case DemoConstants.EvGameStateUpdate:
        if (changedCustomProps.game) {
            var game = this.getCustomProperty("game");
            var t = document.getElementById("gamestate");
            t.textContent = JSON.stringify(game);
            t = document.getElementById("nextplayer");
            t.textContent = "";
            var turnsLeft = 0;
            for (var i = 0; i < game.nextPlayerList.length; i++) {
                if (turnsLeft == 0 && game.nextPlayerList[i] == this.demo.myActor().getId()) {
                    turnsLeft = i;
                }
                t.textContent += " " + game.nextPlayerList[i];
            }
            var t = document.getElementById("info");
            t.textContent = turnsLeft == 0 ? "Your turn now!" : "Wait " + turnsLeft + " turn(s)";
            if (game.nextPlayer == this.demo.myActor().getId()) {
                this.demo.updateAutoplay(this.demo);
            }
        }
        // case DemoConstants.EvPlayersUpdate:
        if (changedCustomProps.game || changedCustomProps.playersStats) {
            var game = this.getCustomProperty("game");
            var playersStats = this.getCustomProperty("playersStats") || {};
            var list = document.getElementById("players");
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
            for (var i_1 in game.players) {
                var id = game.players[i_1];
                var item = document.createElement("li");
                item.attributes["value"] = id;
                var d = game.playersData[id];
                var s = playersStats && playersStats[id];
                item.textContent = d.name + " / " + id + ": " + d.hitCount + " / " + (d.hitCount + d.missCount) + (s ? " [" + s.hitCount + " / " + (s.hitCount + s.missCount) + " / " + s.gamesPlayed + "]" : "");
                item.title = "Player id: " + id + ", name: " + d.name + "\nCurrent game: hits = " + d.hitCount + ", clicks = " + (d.hitCount + d.missCount) + (s ? "\n Totals: games played = " + s.gamesPlayed + ", hits = " + s.hitCount + ", clicks = " + (s.hitCount + s.missCount) : "");
                list.appendChild(item);
            }
        }
    };
    DemoRoom.prototype.loadResources = function (stage) {
        Output.log('aaa');
        this.cards = CardsText;
        Output.log('cardsload' + String(this.cards.length));
        // for (var i = 0; i < this.variety; ++i) {
        //     var img = new Image();
        //     this.icons[i] = img;
        //     img.onload = function () {
        //         Output.log("Image " + img.src + " loaded");
        //         stage.update();
        //     };
        //     img.src = this.iconUrl(i);
        // }
    };
    return DemoRoom;
}(Photon.LoadBalancing.Room));
var DemoPlayer = /** @class */ (function (_super) {
    __extends(DemoPlayer, _super);
    function DemoPlayer(demo, name, actorNr, isLocal) {
        var _this = _super.call(this, name, actorNr, isLocal) || this;
        _this.demo = demo;
        return _this;
    }
    DemoPlayer.prototype.getId = function () {
        return this.getCustomProperty("id");
    };
    DemoPlayer.prototype.getName = function () {
        return this.getCustomProperty("name");
    };
    DemoPlayer.prototype.getParticipation = function () {
        return this.getCustomProperty("participation");
    };
    DemoPlayer.prototype.onPropertiesChange = function (changedCustomProps) {
        if (this.isLocal) {
            document.title = this.getName() + " / " + this.getId() + " Pairs Game (Master Client)";
        }
        this.demo.updatePlayerOnlineList();
    };
    DemoPlayer.prototype.setInfo = function (id, name) {
        this.demo.setUserId(id);
        this.setCustomProperty("id", id);
        this.setCustomProperty("name", name);
    };
    DemoPlayer.prototype.setParticipation = function (p) {
        this.setCustomProperty("participation", p);
    };
    return DemoPlayer;
}(Photon.LoadBalancing.Actor));
var loadBalancingClient;
window.onload = function () {
    loadBalancingClient = new Demo(document.getElementById("canvas"));
    loadBalancingClient.start();
};
