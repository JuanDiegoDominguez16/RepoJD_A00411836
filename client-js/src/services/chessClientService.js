// TODO (Paso 1 y Paso 4.1): Importar el runtime de ZeroC Ice ("../../lib/Ice.min.js"),
// el contrato generado por slice2js ("./ChessService.js") y la clase ChessRealtimeObserver.

/**
 * Servicio de comunicación RPC con ZeroC Ice sobre WebSockets.
 * Encapsula el ciclo de vida del Communicator, el proxy de ChessService
 * y la suscripción en tiempo real mediante ChessRealtimeObserver.
 */

export class ChessClientService {
    constructor() {
        // TODO (Paso 4.1): Inicializar las referencias a window.Ice, window.ChessApp y el estado
        // interno del servicio (communicator, service, realtimeObserver, isConnected, nickname,
        // currentRoomCode, role, assignedColor).
        this.communicator = null;
        this.service = null;
        this.realtimeObserver = null;
        this.isConnected = false;
        this.nickname = null;
        this.currentRoomCode = null;
        this.role = null;
        this.assignedColor = null;
    }

    validateRuntime() {
        // TODO (Paso 4.1): Verificar que window.Ice y window.ChessApp estén disponibles;
        // en caso contrario lanzar un Error descriptivo.
        if (!window.Ice || !window.ChessApp){
            throw new Error("ZeroC Ice runtime or ChessApp contract is not available.");
        }
    }

    async connect(host, port, nickname) {
        // TODO (Paso 4.2):
        // 1. Validar el runtime y destruir cualquier communicator previo.
        // 2. Crear Ice.InitializationData(), configurar Ice.MessageSizeMax = "2048",
        //    Ice.ACM.Client.Timeout = "0" e Ice.ACM.Client.Heartbeat = "3".
        // 3. Inicializar this.communicator = this.Ice.initialize(initData).
        // 4. Construir el proxy WebSocket `ChessService:ws -h ${targetHost} -p ${targetPort}`
        //    y obtener this.service mediante await this.ChessApp.ChessServicePrx.checkedCast(base).
        // 5. Instanciar this.realtimeObserver = new ChessRealtimeObserver(this.Ice, this.ChessApp)
        //    y marcar this.isConnected = true.

        this.validateRuntime();

        if (this.communicator){
            this.communicator.destroy();    
            this.communicator = null;
        }

        this.isConnected = false;

        const initData = new window.Ice.InicializationData();
        initData.properties = window.Ice.createProperties();

        initData.properties.setProperty("Ice.MessageSizeMax", "2048");
        initData.properties.setProperty("Ice.ACM.Client.Timeout", "0");
        initData.properties.setProperty("Ice.ACM.Client.Heartbeat", "3");

        try {
            this.communicator = window.Ice.initialize(initData);

        const targetHost = host;
        const targetPort = port;

        const proxyString = `ChessService:ws -h ${targetHost} -p ${targetPort}`;
        const base = this.communicator.stringToProxy(proxyString);

        this.service = await window.ChessApp.ChessServicePrx.checkedCast(base);

        if (!this.service) {
            throw new Error("Invalid proxy for ChessService.");
        }
        
        this.realtimeObserver = new window.ChessRealtimeObserver(this.Ice, this.ChessApp);
        this.isConnected = true;

        }catch(error){
            this.isConnected = false;

            if(this.communicator){
                this.communicator.destroy();
                this.communicator = null;
            }
            throw error;
        }
    }

    async getLobbyData() {
        // TODO (Paso 4.3): Consultar concurrentemente getActiveRooms() y getLeaderboard()
        // en el servidor y retornar { rooms, leaderboard }.

        this.ensureConnected();
        const [rooms, leaderboard] = await Promise.all([
            this.service.getActiveRooms(),
            this.service.getLeaderboard()
        ]);

        return { rooms, leaderboard };
    }

    async createRoom(nickname) {
        // TODO (Paso 4.3): Invocar remotamente createRoom(this.nickname) y retornar el código generado.
        this.ensureConnected();
        const roomCode = await this.service.createRoom(nickname);
        return roomCode;
       
    }

    async joinRoom(roomCode, nickname) {
        // TODO (Paso 4.3): Normalizar el código de sala en mayúsculas, invocar
        // joinRoom(normalizedCode, this.nickname), actualizar this.currentRoomCode,
        // this.role y this.assignedColor, y retornar el JoinRoomResult.

        this.ensureConnected();
        const normalizedCode = roomCode.toUpperCase();
        const joinResult = await this.service.joinRoom(normalizedCode, nickname);
        this.currentRoomCode = normalizedCode;
        this.role = joinResult.role;
        this.assignedColor = joinResult.assignedColor;
        return joinResult;
    }

    async subscribeToRoom(listeners = {}) {
        // TODO (Paso 4.4): Delegar la suscripción en tiempo real a
        // await this.realtimeObserver.subscribe(this.communicator, this.service, this.currentRoomCode, this.nickname, listeners).
        this.ensureConnected();
        await this.realtimeObserver.subscribe(this.communicator,
             this.service,
              this.currentRoomCode,
               this.nickname,
                listeners);

    }

    async makeMove(fromRow, fromCol, toRow, toCol) {
        // TODO (Paso 4.4): Instanciar dos objetos this.ChessApp.Position(row, col)
        // e invocar await this.service.makeMove(this.currentRoomCode, this.nickname, fromPos, toPos).
    }

    async resign() {
        // TODO (Paso 4.4): Invocar await this.service.resign(this.currentRoomCode, this.nickname).
    }

    async leaveRoom() {
        // TODO (Paso 4.4): Desuscribir this.realtimeObserver, invocar
        // await this.service.leaveRoom(this.currentRoomCode, this.nickname) y limpiar el estado de sala actual.
    }

    ensureConnected() {
        // TODO: Verificar que el cliente esté conectado antes de realizar llamadas RPC.
    }
}
