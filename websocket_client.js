const WebSocketClient = require('websocket').client
const {v4: uuidv4} = require('uuid')

module.exports = class WebsocketClient {
    constructor(host, database) {
        this.host = host
        this.database = database

        this.connected = false

        this.requests = new Map()
    }

    connect(){
        return new Promise((resolve, reject) => {
            this.ws = new WebSocketClient()

            this.ws.on("connectFailed", (error) => {
                reject(error)
            })

            this.ws.on("connect", (connection) => {
                this.connection = connection

                this.connection.on("error", (error) => {
                    console.log('InfiniteDB websocket connection closed with error ' + error)
                    this.connected = false
                })

                this.connection.on("close", () => {
                    console.log('InfiniteDB websocket connection closed')
                    this.connected = false
                })

                this.connection.on("message", (msg) => {
                    const res = JSON.parse(msg.utf8Data)

                    switch(res.message) {
                        case "HELO":
                            this.connected = true
                            resolve()
                            break
                        default:
                            let requestId = res.requestId

                            if(requestId){
                                let request = this.requests.get(requestId)

                                if(res.status === 200){
                                    request.resolve(res)
                                }else{
                                    request.reject(res)
                                }
                            }else{
                                reject("Server response did not have a requestId")
                            }

                            break
                    }
                })
            })

            this.ws.connect(`ws://${this.host.hostname}:${this.host.port}/ws`)
        })
    }

    #send(data){
        if(this.connected){
            this.connection.sendUTF(JSON.stringify(data))
        }else{
            throw "Not connected to websocket"
        }
    }

    #sendRequest(request){
        let requestId = uuidv4()

        return new Promise(((resolve, reject) => {
            this.requests.set(requestId, {resolve: resolve, reject: reject})

            request.requestId = requestId
            request.name = this.database

            this.#send(request)
        }))
    }

    async getDatabase(){
        return await this.#sendRequest({ method: "getDatabase" })
    }

    async getDatabaseTables(){
        return await this.#sendRequest({ method: "getDatabaseTables" })
    }

    async createTableInDatabase(tableName, fields){
        return await this.#sendRequest({ method: "createTableInDatabase", tableName: tableName, fields: fields })
    }

    async getFromDatabaseTable(tableName, request){
        return await this.#sendRequest({ method: "getFromDatabaseTable", tableName: tableName, request: request })
    }

    async insertToDatabaseTable(tableName, object){
        return await this.#sendRequest({ method: "insertToDatabaseTable", tableName: tableName, object: object })
    }

    async removeFromDatabaseTable(tableName, request){
        return await this.#sendRequest({ method: "removeFromDatabaseTable", tableName: tableName, request: request })
    }

    async updateInDatabaseTable(tableName, object){
        return await this.#sendRequest({ method: "updateInDatabaseTable", tableName: tableName, object: object })
    }
}