/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="app.ts"/> 

// Game logic runs on one of the conected clients - master client~
// Server Lua Extension Scripts port (see demo-pairs)
// map and mapProgress arrays start for 1 because of lua origial source (and may be compatibility)

var GameProperties = {
}

class MasterClient {

    private logger = new Exitgames.Common.Logger("MC:", Exitgames.Common.Logger.Level.DEBUG);

    // private flushPropsFlag = false; // set this flag to send props update
    // private game: any; // room property copy for modification and update (persistent game state)
    // private state: any; // room property copy for modification and update (state to reset after game load)
    constructor(private client: Demo) {
        this.logger.info("Created");
    }

    // Master is client with smallest actorNr
    // TODO: cache it and update only on changes
    isMaster(): boolean {
        var myActorNr = this.client.myActor().actorNr;
        for (var i in this.client.myRoomActors()) {
            if (parseInt(i) < myActorNr) {
                return false;
            }
        }
        return true;
    }
    // sends to all including itself
    broadcast(eventCode: number, data?: any, options?: { interestGroup?: number; cache?: number; receivers?: number; targetActors?: number[]; }) {
        this.logger.debug("broadcast", eventCode);
        this.client.raiseEventAll(eventCode, data, options);
    }


    onJoinRoom() {
        if (!this.isMaster()) return;
        this.logger.debug("onJoinRoom");
    }

    onActorJoin(actor: Photon.LoadBalancing.Actor) {
        if (!this.isMaster()) return;
        this.logger.debug("onActorJoin", actor.actorNr);
    }

    onActorLeave(actor: Photon.LoadBalancing.Actor) {
        if (!this.isMaster()) return;
        this.logger.debug("onActorLeave", actor.actorNr);
    }

    private onPlayerJoin(actor: Photon.LoadBalancing.Actor) {
        if (!this.isMaster()) return;
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
    }

    onEvent(code: number, content: any, actorNr: number) {
        if (!this.isMaster()) return;

        // this.cacheProps();
        switch (code) {
            case DemoConstants.EvNewGame:
                this.OnNewGameEvent(actorNr, code, content);
                break;
        }
        // this.flushProps();
    }

    onStateChange(state: number) {
        if (!this.isMaster()) return;
    }

    onOperationResponse(errorCode: number, errorMsg: string, code: number, content: any) {
        if (!this.isMaster()) return;
    }

    private OnNewGameEvent(actorNr: number, evCode: number, data: any) {
        var actors = this.client.myRoomActors();
        // var trivial = data && data.trivial;
        var players = new Array<number>();
        var observers:Array<number> = [];
        for (var a in actors) {
            if (actors[a].getParticipation()==2){
                actors[a].setParticipation(1)
                players.push(actors[a].actorNr);
                continue
            }
            if (actors[a].getParticipation()==1){
                players.push(actors[a].actorNr);
                continue
            }
            if (actors[a].getParticipation()==0){
                observers.push(actors[a].actorNr)
            }
        }
        this.broadcast(DemoConstants.EvUpdatePlayers,null)
        this.InitGame(players);
        for (var i in observers){
            var anr = observers[i]
            this.broadcast(DemoConstants.EvBeginObserver,null,{targetActors:[anr]})
        }
    }

    private shuffled = {};

    private InitGame(players: Array<number>) {
        Output.log('initgame')
        var acqnum : {[Nr:number]:number} = {};
        var decknum : {[Nr:number]:number} = {};
        for (var i in players){
            var Nr = players[i]
            Output.log('player'+String(Nr))
            acqnum[Nr] = 0
            decknum[Nr] = 7
        }
        this.client.myRoom().setCustomProperty('acqnum',acqnum)
        this.client.myRoom().setCustomProperty('decksize',decknum)
        this.client.myRoom().emptyFieldCards(players)
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
    }

    private ShuffleCards(players:Array<number>){
        var cardnum: number = this.client.myRoom().cards.length
        function shuffle(num) {
            var array = [];
            for (var i=0; i<num; ++i){
                array.push(i)
            }
            var currentIndex = num;
            var randomIndex = num;
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                // And swap it with the current element.
                [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
            }
            return array;
        } 
        var allsh = shuffle(cardnum)
        for (var i in players){
            var j = parseInt(i)
            var anr = players[i]
            this.shuffled[anr]=allsh.slice(7*j,7*(j+1))
            this.broadcast(DemoConstants.EvDistributeCards,this.shuffled[anr],{targetActors:[anr]})
        }
    }

    // private GamePlayerDataInit(id: string, data: any) {
    //     this.game.playersData[id] = {
    //         id: id, name: data && data.name,
    //         hitCount: 0,
    //         missCount: 0
    //     }
    // }

    // private GamePlayerDataUpdate(id: string, data: any) {
    //     this.game.playersData[id].name = data && data.name;
    // }

}
