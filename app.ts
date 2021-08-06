/// <reference path="3rdparty/easeljs.d.ts" />          
/// <reference path="Photon/Photon-Javascript_SDK.d.ts"/> 
/// <reference path="master-client.ts"/> 
/// <reference path="cards.ts"/> 

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

var DemoConstants =
{
    // EvClick: 1,
//    EvGetMap: 2, // for debug only
//    EvGetMapProgress: 3,
    EvNewGame: 4,

    MasterEventMax: 100, // separate events handled by master client from client events

    EvGameStateUpdate: 101,
    EvPlayersUpdate: 102,
    EvGameMap: 103,
    // EvClickDebug: 104,
    EvDistributeCards: 201,
    EvShowCards: 105,
    EvAcquireCards: 106,
//    EvGameMapProgress: 107,
    EvMoveTimer: 108,

    EvDisconnectOnAlreadyConnected: 151,
   
    GameStateProp: "gameState",
    MoveCountProp: "moveCount",

    LogLevel: Exitgames.Common.Logger.Level.DEBUG,
}



class CardVisual extends createjs.Container{
    public shape = new createjs.Shape();
    public text = new createjs.Text('','12px Arial','black');
    public hiddenshape = new createjs.Shape();
    public hit = new createjs.Shape();
    public highlight = new createjs.Shape();
    constructor(){
        super()
        this.shape.graphics.beginStroke('black').beginFill('white');
        this.shape.graphics.drawRoundRect(0,0,100,40,10);
        this.text.textAlign = 'center';
        this.text.textBaseline = 'middle';
        this.text.maxWidth = 90;
        this.text.x = 50;
        this.text.y = 20
        this.hiddenshape.graphics.beginStroke('rgba(50,50,50,0.5)')
        this.hiddenshape.graphics.drawRoundRect(0,0,100,40,10);
        this.hiddenshape.visible = false;
        this.highlight.graphics.beginFill('yellow')
        this.highlight.graphics.drawRoundRect(0,0,100,40,10);
        this.highlight.visible=false;
        this.addChild(this.shape)
        this.addChild(this.hiddenshape)
        this.addChild(this.highlight)
        this.addChild(this.text)

        this.hit.graphics.beginFill('black').drawRoundRect(0,0,100,40,10)
        this.hitArea = this.hit
    }
    showcard(newtext:string){
        if (newtext==''){
            this.hidecard()
            return
        }
        this.text.text = newtext
        this.shape.visible=true
        this.text.visible=true
        this.hiddenshape.visible=false
        this.highlight.visible=false
    }
    hidecard(){
        this.shape.visible=false
        this.text.text=''
        this.text.visible=false
        this.hiddenshape.visible=true
        this.highlight.visible=false
    }
    semi_visible(){
        this.hiddenshape.visible=true
        this.text.visible=true
        this.shape.visible=false
        this.highlight.visible=false
    }
    selected(){
        this.highlight.visible=true
    }
}

class CardSetVisual extends createjs.Container{
    public cardnum: number = 7;
    public cards = [];
    constructor(){
        super()
        for (var i=0; i<this.cardnum; ++i){
            this.cards[i]=new CardVisual()
            this.cards[i].name=String(i)
            this.cards[i].y = i*45
            this.addChild(this.cards[i])
        }
        this.hideall()
    }
    getcard(i:number){
        return this.cards[i]
    }
    hideall(){
        for(var i=0;i<this.cardnum;++i){
            this.getcard(i).hidecard()
        }
    }
    semi_all(){
        for(var i=0;i<this.cardnum;++i){
            this.getcard(i).semi_visible()
        }
    }
    showcard(i:number,s:string){
        this.getcard(i).showcard(s)
    }
    showcards(strings:Array<string>){
        for (var i in strings){
            this.showcard(parseInt(i),strings[i])
        }
    }
    selected(i:number){
        this.getcard(i).selected()
    }
}

class DeckVisual extends createjs.Container{
    private shape = new createjs.Shape();
    private numtext = new createjs.Text('','20px Arial','black');
    constructor(){
        super();
        this.shape.graphics.beginStroke('black').beginFill('white')
        this.shape.graphics.drawRoundRect(0,0,30,40,10)
        this.numtext.textAlign = 'center'
        this.numtext.textBaseline = 'middle'
        this.numtext.maxWidth = 25
        this.numtext.x = 15
        this.numtext.y = 20
        this.addChild(this.shape)
        this.addChild(this.numtext)
    }
    setnum(i:number){
        this.numtext.text = String(i);
    }
}

class AcquiredNumberVisual extends createjs.Container{
    private description = new createjs.Text('total','12px Arial','black')
    private numtext = new createjs.Text('0','20px Arial','black')
    private shape = new createjs.Shape()
    constructor(){
        super()
        this.shape.graphics.beginStroke('black')
        this.shape.graphics.drawRoundRect(0,0,60,40,10)
        this.addChild(this.shape)
        this.description.textAlign = 'center'
        this.description.textBaseline = 'bottom'
        this.description.maxWidth = 50
        this.description.x = 30
        this.description.y = 15
        this.addChild(this.description)
        this.numtext.textAlign = 'center'
        this.numtext.textBaseline = 'bottom'
        this.numtext.maxWidth = 50
        this.numtext.x = 30
        this.numtext.y = 35
        this.addChild(this.numtext)
    }
    public setnum(num:number){
        this.numtext.text=String(num)
    }
}

class PlayerVisual extends createjs.Container{
    private playername = new createjs.Text('name','12px Arial','black');
    private decknum = new DeckVisual();
    private acqnum = new AcquiredNumberVisual();
    private showncards = new CardSetVisual();
    constructor(){
        super();
        this.playername.textAlign = 'center'
        this.playername.textBaseline = 'middle'
        this.playername.maxWidth = 100
        this.playername.x = 50
        this.playername.y = 10
        this.addChild(this.playername)
        this.decknum.x=5
        this.decknum.y = 20
        this.addChild(this.decknum)
        this.acqnum.x = 40
        this.acqnum.y = 20
        this.addChild(this.acqnum)
        this.showncards.y= 70
        this.addChild(this.showncards)
    }
    public showcards(strings:Array<string>){
        this.showncards.showcards(strings)
    }
    public setname(name:string){
        this.playername.text = name
    }
    public setdecksize(num:number){
        this.decknum.setnum(num)
    }
    public setacqnum(num:number){
        this.acqnum.setnum(num)
    }
}

class PlayerSetVisual extends createjs.Container{
    private players: {[Nr: number]: PlayerVisual;} = {};
    constructor(Nrs:Array<number>){
        super();
        for(var i=0;i<Nrs.length;++i){
            var oneNr = Nrs[i]
            this.players[oneNr] = new PlayerVisual();
            this.players[oneNr].x = i*110
            this.addChild(this.players[oneNr])
        }
    }
    getplayervisual(Nr:number){
        return this.players[Nr]
    }
    setnames(Nrs,names){
        for (var i in Nrs){
            var Nr = Nrs[i]
            var name = names[i]
            this.getplayervisual(Nr).setname(name)
        }
    }
    setDeckSize(decksize:{[Nr:number]:number}){
        Output.log('decksize:',String(decksize))
        for (var Nr in decksize){
            Output.log('Nr:',Nr)
            Output.log('decksizeNr:',decksize[Nr])
            var ply = this.getplayervisual(parseInt(Nr))
            if (!(ply instanceof PlayerVisual)){continue}
            Output.log('setsize:',decksize[Nr])
            ply.setdecksize(decksize[Nr])
        }
    }
    setAcqNum(acqsize:{[Nr:number]:number}){
        for (var Nr in acqsize){
            Output.log('Nr:',Nr)
            Output.log('acqNr:',acqsize[Nr])
            var ply = this.getplayervisual(parseInt(Nr))
            if (!(ply instanceof PlayerVisual)){return}
            ply.setacqnum(acqsize[Nr])
        }
    }
}

class ButtonVisual extends createjs.Container{
    private shape = new createjs.Shape();
    private label = new createjs.Text('acquire','12px Arial','black')
    constructor(labeltext:string){
        super();
        this.shape.graphics.beginStroke('black').beginFill('white').drawRoundRect(0,0,60,20,10)
        this.label.text = labeltext
        this.label.textAlign = 'center'
        this.label.textBaseline = 'middle'
        this.label.x = 30;
        this.label.y = 10
        this.addChild(this.shape)
        this.addChild(this.label)
    }
}

class CardIndex {
    private n:number=7;
    private originalplace: {[ix:number]:number;} = {};
    public deckindex: Array<number> = []
    public editorindex: Array<number> = []
    public fieldindex = {};
    public stagemode: boolean = false;
    // 0:editor 1:stage
    empty(){
        for (var i=0; i<this.n; ++i){
            this.deckindex[i] = -1
            this.editorindex[i] = -1
            for (var j in this.fieldindex){
                this.fieldindex[j][i]=-1
            }
        }
    }
    distribute(cardindeces: Array<number>){
        this.empty()
        this.deckindex = cardindeces;
        for (var i in cardindeces){
            this.originalplace[cardindeces[i]] = parseInt(i);
        }
    }
    constructor(actorNrs:Array<number>){
        for (var i in actorNrs){
            var Nr = actorNrs[i]
            this.fieldindex[Nr]=[]
        }
        this.empty();
    }
    toeditor(ix:number,dest:number){
        var cardix = this.deckindex[ix]
        if (cardix==-1){return}
        var endix = this.editorindex[dest]
        if (endix!=-1){return}
        this.deckindex[ix]=-1
        this.editorindex[dest]=cardix
    }
    todeck(ix:number,dest:number){
        var cardix = this.editorindex[ix]
        if (cardix==-1){return}
        var endix = this.deckindex[dest]
        if (endix!=-1){return}
        this.editorindex[ix]=-1
        this.deckindex[dest]=cardix
    }
    public toStage(){
        this.stagemode=true
    };
    public fromStage(){
        this.stagemode=false
    }
    recievefield(actorNr:number,cards:Array<number>){
        this.fieldindex[actorNr] = cards
        Output.log('recieved'+String(actorNr)+String(cards))
    }
    acquire(){
        for (var i in this.editorindex){
            this.editorindex[i]=-1
            for (var Nr in this.fieldindex){
                this.fieldindex[Nr][i]=-1
            }
        }
        this.fromStage()
    }
    getcardnum(){
        var deck = this.deckindex.filter(ix => ix!=-1)
        if (this.stagemode){return deck.length}
        var editor = this.editorindex.filter(ix => ix!=-1)
        var num:number = deck.length + editor.length
        return num
    }
    cardsinfield(){
        var num:number = 0
        for (var Nr in this.fieldindex){
            num += this.fieldindex[Nr].filter(ix => ix!=-1).length
        }
        return num
    }
    getstage(){
        if (this.stagemode){
            return this.editorindex
        }
        var emp = [];
        for (var i=0;i<this.n;++i){
            emp[i]=-1
        }
        return emp
    }
}

class Demo extends Photon.LoadBalancing.LoadBalancingClient {

    masterClient: MasterClient;

    public useGroups: boolean = false;
    public automove: boolean = false;
    private cardIndex: CardIndex;


    constructor(private canvas: HTMLCanvasElement) {
        super(DemoWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, DemoAppId, DemoAppVersion);
        this.masterClient = new MasterClient(this);

        // uncomment to use Custom Authentication
        // this.setCustomAuthentication("username=" + "yes" + "&token=" + "yes");
        Output.log(String(DemoWss))
        var addr = this.getNameServerAddress();

        Output.log("Init",addr, DemoAppId, DemoAppVersion);
        this.logger.info("Init", DemoAppId, DemoAppVersion);
        this.setLogLevel(DemoConstants.LogLevel);
    }

    // sends to all including itself
    raiseEventAll(eventCode: number, data?: any, options?: { interestGroup?: number; cache?: number; receivers?: number; targetActors?: number[]; }) {
        options = options || {};
        options.receivers = Photon.LoadBalancing.Constants.ReceiverGroup.All;
        this.raiseEvent(eventCode, data, options);
    }

    logger = new Exitgames.Common.Logger("Demo:", DemoConstants.LogLevel);

    // overrides
    roomFactory(name: string) { return new DemoRoom(this, name); }
    actorFactory(name: string, actorNr: number, isLocal: boolean) { return new DemoPlayer(this, name, actorNr, isLocal); }
    myRoom() { return <DemoRoom>super.myRoom(); }
    myActor() { return <DemoPlayer>super.myActor(); }
    myRoomActors() { return <{ [index: number]: DemoPlayer }>super.myRoomActors(); }

    start() {
        this.stage = new createjs.Stage(this.canvas);
        this.setupUI();
        this.myRoom().loadResources(this.stage);
    }

    // overrides
    onError(errorCode: number, errorMsg: string) {
        Output.log("Error", errorCode, errorMsg);
        // optional super call
        super.onError(errorCode, errorMsg);
    }

    onOperationResponse(errorCode: number, errorMsg: string, code: number, content: any) {

        this.masterClient.onOperationResponse(errorCode, errorMsg, code, content);

        if (errorCode) {
            switch (code) {                
                case Photon.LoadBalancing.Constants.OperationCode.JoinRandomGame:
                    switch (errorCode) {
                        case Photon.LoadBalancing.Constants.ErrorCode.NoRandomMatchFound:
                            Output.log("Join Random:", errorMsg);
                            this.createDemoRoom();
                            break
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
    }

    onEvent(code: number, content: any, actorNr: number) {

        this.masterClient.onEvent(code, content, actorNr);

        switch (code) {
            case DemoConstants.EvDisconnectOnAlreadyConnected:
                Output.log("Disconnected by Master Client as already connected player");
                this.disconnect();
                break;
            case DemoConstants.EvDistributeCards:
                Output.log('distribute',content)
                this.cardIndex.distribute(content)
                this.registerDeckSize()
                this.updateCard()
                break
            case DemoConstants.EvShowCards:
                Output.log('recieved show event'+String(content))
                this.cardIndex.recievefield(actorNr,content)
                this.updateCard()
                break;
            case DemoConstants.EvAcquireCards:
                this.cardIndex.acquire();
                this.updateCard()
                break;
            default:
            }

        this.logger.info("Demo: onEvent", code, "content:", content, "actor:", actorNr);
    }

    onStateChange(state: number) {
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
    }


    private updateMasterClientMark() {
        var el = document.getElementById("masterclientmark");
        el.textContent = this.masterClient.isMaster() ? "!" : "";
    }

    onRoomListUpdate(rooms: Photon.LoadBalancing.RoomInfo[], roomsUpdated: Photon.LoadBalancing.RoomInfo[], roomsAdded: Photon.LoadBalancing.RoomInfo[], roomsRemoved: Photon.LoadBalancing.RoomInfo[]) {
        //        Output.log("onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.updateRoomButtons(); // join btn state can be changed
    }

    onRoomList(rooms: Photon.LoadBalancing.RoomInfo[]) {
        this.updateRoomButtons();
    }

    onJoinRoom() {
        this.updateMasterClientMark();
        this.masterClient.onJoinRoom();

        this.logger.info("onJoinRoom myRoom", this.myRoom());
        this.logger.info("onJoinRoom myActor", this.myActor());
        this.logger.info("onJoinRoom myRoomActors", this.myRoomActors());
        this.updatePlayerOnlineList();

        this.stage.update();
    }

    onActorJoin(actor: Photon.LoadBalancing.Actor) {
        this.updateMasterClientMark();
        this.masterClient.onActorJoin(actor);
        Output.log("actor " + actor.actorNr + " joined");
        this.updatePlayerOnlineList();
    }

    onActorLeave(actor: Photon.LoadBalancing.Actor) {
        this.updateMasterClientMark();
        this.masterClient.onActorLeave(actor);
        Output.log("actor " + actor.actorNr + " left");
        this.updatePlayerOnlineList();
    }

    // tools
    private createDemoRoom() {
        Output.log("New Game");
        this.myRoom().setEmptyRoomLiveTime(10000);
        this.createRoomFromMy("DemoPairsGame (Master Client)");
    }

    private registerDeckSize(){
        Output.log('register'+String(this.myActor().actorNr))
        this.myRoom().registerDeckSize(this.myActor().actorNr,
            this.cardIndex.getcardnum())
    }

    //scene
    private stage: createjs.Stage;

    private bgColor = 'rgba(220,220,220,255)';

    private setupScene() {
        this.stage.removeAllChildren();
        this.canvas.width = 700
        this.canvas.height = 420
        this.drawBg();
        this.drawGrid();
        this.setupSceneUI();
        this.stage.update();
    }

    private updateCard(){
        this.mydeck.hideall()
        Output.log('start update cards')
        var deckcards = this.myRoom().getcards(this.cardIndex.deckindex)
        Output.log(String(deckcards))
        this.mydeck.showcards(deckcards)
        var editcards = this.myRoom().getcards(this.cardIndex.editorindex)
        Output.log(String(editcards))
        this.editfield.showcards(editcards)
        if (this.cardIndex.stagemode){this.editfield.semi_all()}
        var fieldindeces = this.cardIndex.fieldindex
        for (var j in fieldindeces){
            var Nr = parseInt(j)
            var idx = fieldindeces[Nr]
            var cards = this.myRoom().getcards(idx)
            Output.log(String(cards))
            this.players.getplayervisual(Nr).showcards(cards)
        }
        var decksize = this.myRoom().getDecksize()
        Output.log('decksize:',String(decksize))
        this.players.setDeckSize(decksize)
        var acqnum = this.myRoom().getAcqNum()
        this.players.setAcqNum(acqnum)

        switch(this.selset){
            case 0:
                break;
            case 1:
                this.mydeck.selected(this.selplace)
                break
            case 2:
                this.editfield.selected(this.selplace)
                break
        }

        this.stage.update()
    }

    private drawBg() {
        var bg = new createjs.Shape();
        bg.graphics.beginFill(this.bgColor).drawRect(0, 0, this.canvas.width, this.canvas.height);
        this.stage.addChild(bg);
    }

    private mydeck:CardSetVisual;
    private editfield:CardSetVisual;
    private players:PlayerSetVisual;
    private acquire_btn:ButtonVisual;
    private show_btn:ButtonVisual;
    private hide_btn:ButtonVisual;

    private drawGrid() {
        var actors = this.myRoomActors();
        var actornames = [];
        var actorNrs = [];
        for (var a in actors){
            Output.log('testactor'+a)
            if (actors[a].getParticipation()!=1){continue}
            actorNrs.push(parseInt(a));
            actornames.push(actors[a].getName())
            Output.log('actornr'+String(a))
        }
        this.cardIndex = new CardIndex(actorNrs);
        this.mydeck = new CardSetVisual();
        this.mydeck.x = 0
        this.mydeck.y = 70
        this.editfield = new CardSetVisual();
        this.editfield.x = 110
        this.editfield.y = 70
        this.players = new PlayerSetVisual(actorNrs);
        this.players.setnames(actorNrs,actornames)
        this.players.x = 220
        this.players.y = 0

        this.show_btn = new ButtonVisual('show')
        this.show_btn.x = 110 
        this.show_btn.y = 395
        this.hide_btn = new ButtonVisual('hide')
        this.hide_btn.x = 30 
        this.hide_btn.y = 395
        this.acquire_btn = new ButtonVisual('acquire')
        this.acquire_btn.x = 220 
        this.acquire_btn.y = 395

        this.stage.addChild(this.mydeck)
        this.stage.addChild(this.editfield)
        this.stage.addChild(this.players)
        this.stage.addChild(this.show_btn)
        this.stage.addChild(this.hide_btn)
        this.stage.addChild(this.acquire_btn)

        this.updateCard()
    }

    private selplace:number=0;
    private selset:number=0;
    // selset 0:nan 1:deck 2:editor

    private deckClicked(place: number){
        Output.log('deck'+String(place))
        switch(this.selset){
            case 0:
                this.selset=1
                this.selplace=place
                this.updateCard()
                break
            case 1:
                this.selset=0
                this.updateCard()
                break
            case 2:
                this.cardIndex.todeck(this.selplace,place)
                this.selset=0
                this.updateCard()
                if (this.cardIndex.stagemode){this.openCard()}
                break
        }
    }
    private editorClicked(place: number){
        Output.log('editor'+String(place))
        switch(this.selset){
            case 0:
                this.selset=2
                this.selplace=place
                this.updateCard()
                break
            case 2:
                this.selset=0
                this.updateCard()
                break
            case 1:
                this.cardIndex.toeditor(this.selplace,place)
                this.selset=0
                this.updateCard()
                if (this.cardIndex.stagemode){this.openCard()}
                break
        }
    }
    private openCard(){
        this.registerDeckSize()
        this.raiseEventAll(DemoConstants.EvShowCards, this.cardIndex.getstage());
    }

    private setupSceneUI(){
        this.show_btn.addEventListener("click", (ev)=>{
            this.cardIndex.toStage();
            this.openCard()
        })
        this.hide_btn.addEventListener("click", (ev)=>{
            this.cardIndex.fromStage();
            this.openCard()
        })
        this.acquire_btn.addEventListener("click",(ev)=>{
            this.myRoom().addAcqNum(this.myActor().actorNr,this.cardIndex.cardsinfield())
            this.raiseEventAll(DemoConstants.EvAcquireCards)
        })
        for (var i in this.mydeck.cards){
            this.mydeck.cards[i].addEventListener("click",(ev)=>{
                this.deckClicked(parseInt(ev.target.name))
            })
            this.editfield.cards[i].addEventListener("click",(ev)=>{
                this.editorClicked(parseInt(ev.target.name))
            })
        }
    }

    // ui
    private setupUI() {

        var btn = <HTMLButtonElement>document.getElementById("connectbtn");
        btn.onclick = (ev) => {
            var n = <HTMLButtonElement>document.getElementById("playername");
            //                this.myActor().setName(n.value);

            var id = "n:" + n.value;

            // clients set actors's id
            this.myActor().setInfo(id, n.value);
            this.myActor().setParticipation(2)
            this.myActor().setCustomProperty("auth", { name: n.value });
            this.connectToRegionMaster("US");
        }
        btn = <HTMLButtonElement>document.getElementById("disconnectbtn");
        btn.onclick = (ev) => {
            this.disconnect();
            return false;
        }

        btn = <HTMLButtonElement>document.getElementById("newgame");
        btn.onclick = (ev) => {
            this.raiseEventAll(DemoConstants.EvNewGame, null);
            return false;
        }
        btn = <HTMLButtonElement>document.getElementById("newtrivial");
        btn.onclick = (ev) => {
            this.raiseEventAll(DemoConstants.EvNewGame, { trivial: true });
            return false;
        }
        this.updateRoomButtons();
    }
    public updatePlayerOnlineList() {
        var list = document.getElementById("playeronlinelist");
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        for (var i in this.myRoomActors()) {
            var a = this.myRoomActors()[i];
            var item = document.createElement("li");
            item.attributes["value"] = a.getName();
            item.textContent = a.getName() + " / " + a.actorNr;
            if (a.isLocal) {
                item.textContent = "-> " + item.textContent;
            }
            list.appendChild(item);
            this.logger.info("actor:", a);
        }
        this.setupScene()
    }

    private updateRoomButtons() {
        var btn;
        var connected = this.state != Photon.LoadBalancing.LoadBalancingClient.State.Uninitialized && this.state != Photon.LoadBalancing.LoadBalancingClient.State.Disconnected
        btn = <HTMLButtonElement>document.getElementById("connectbtn");
        btn.disabled = connected;
        btn = <HTMLButtonElement>document.getElementById("disconnectbtn");
        btn.disabled = !connected;
        btn = document.getElementById("newgame");
        btn.disabled = !this.isJoinedToRoom()
        btn = document.getElementById("newtrivial");
        btn.disabled = !this.isJoinedToRoom()

    }
}

class Output {
    public static logger = new Exitgames.Common.Logger();

    static log(str: string, ...op: any[]) {
        var log = document.getElementById("log");
        var formatted = this.logger.formatArr(str, op);
        var newLine = document.createElement('div');
        newLine.textContent = formatted;
        log.appendChild(newLine);
        log.scrollTop = log.scrollHeight;
    }
}

class DemoRoom extends Photon.LoadBalancing.Room {
    constructor(private demo: Demo, name: string) {
        super(name);
        var decksize:{[Nr:number]:number}={};
        this.setCustomProperty('decksize',decksize)
        var acqnum:{[Nr:number]:number}={};
        this.setCustomProperty('acqnum',acqnum)
    }

    public cards = []
    public card(i: number){
        if (i==-1){return ''}
        return this.cards[i]
    }
    public getcards(indeces:Array<number>){
        var out:Array<string> = [];
        for (var i in indeces){
            out[i] = this.card(indeces[i])
        }
        return out
    }
    public initializeDeckSize(){
        this.setCustomProperty('decksize',{})
    }
    public registerDeckSize(Nr:number,num:number){
        var decksize = this.getCustomProperty('decksize')
        decksize[Nr]=num
        Output.log('registerNr'+String(Nr))
        Output.log('registernum'+String(num))
        this.setCustomProperty('decksize',decksize)
    }
    public getDecksize(){
        return this.getCustomProperty('decksize')
    }
    public registerAcqNum(Nr:number,num:number){
        var acqnum = this.getCustomProperty('acqnum')
        acqnum[Nr]=num
        this.setCustomProperty('acqnum',acqnum)
    }
    public addAcqNum(Nr:number,num:number){
        var acqnum = this.getCustomProperty('acqnum')
        acqnum[Nr]+=num
        this.setCustomProperty('acqnum',acqnum)
    }
    public getAcqNum(){
        return this.getCustomProperty('acqnum')
    }

    public onPropertiesChange(changedCustomProps: any, byClient?: boolean) {
        //case DemoConstants.EvGameStateUpdate:
        if (changedCustomProps.game) {

            var game = this.getCustomProperty("game");

            var t = document.getElementById("gamestate");
            t.textContent = JSON.stringify(game);
        }

        // case DemoConstants.EvPlayersUpdate:
        if (changedCustomProps.game || changedCustomProps.playersStats) {
            var game = this.getCustomProperty("game");
            var playersStats = this.getCustomProperty("playersStats") || {};

            var list = document.getElementById("players");
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
            
            for (let i in game.players) {
                var id = game.players[i];
                var item = document.createElement("li");
                item.attributes["value"] = id;
                var d = game.playersData[id];
                var s = playersStats && playersStats[id];
                // item.textContent = d.name + " / " + id + ": " + d.hitCount + " / " + (d.hitCount + d.missCount) + (s ? " [" + s.hitCount + " / " + (s.hitCount + s.missCount) + " / " + s.gamesPlayed + "]" : "");
                // item.title = "Player id: " + id + ", name: " + d.name + "\nCurrent game: hits = " + d.hitCount + ", clicks = " + (d.hitCount + d.missCount) + (s ? "\n Totals: games played = " + s.gamesPlayed + ", hits = " + s.hitCount + ", clicks = " + (s.hitCount + s.missCount) : "");
                list.appendChild(item);
            }
        }
    }

    public loadResources(stage: createjs.Stage) {
        this.cards = CardsText;
        Output.log('cardsload'+String(this.cards.length))
    }
}

class DemoPlayer extends Photon.LoadBalancing.Actor {
    constructor(private demo: Demo, name: string, actorNr: number, isLocal: boolean) {
        super(name, actorNr, isLocal);
    }
    public getId() {
        return this.getCustomProperty("id");
    }
    public getName() {
        return this.getCustomProperty("name");
    }
    public getParticipation() {
        return this.getCustomProperty("participation");
    }
    public onPropertiesChange(changedCustomProps: any) {
        if (this.isLocal) {
            document.title = this.getName() + " / "+"Surreal";
        }
        this.demo.updatePlayerOnlineList();
    }

    public setInfo(id: string, name: string) {
        // this.demo.setUserId(id);
        // this.setCustomProperty("id", id);
        this.setCustomProperty("name", name);
    }
    public setParticipation(p:number){
        this.setCustomProperty("participation",p);
    }
}

var loadBalancingClient;
window.onload = () => {
  loadBalancingClient = new Demo(<HTMLCanvasElement>document.getElementById("canvas"));
    loadBalancingClient.start();
}