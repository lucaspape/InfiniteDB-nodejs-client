const WebsocketClient = require('./websocket_client')

module.exports = class Client {
    constructor(host, database) {
        this.host = host
        this.database = database
    }

    static async getDatabases(host){
        return await (await fetch(`http://${host.hostname}:${host.port}/databases`)).json()
    }

    static async createDatabase(host, name){
        return await (await fetch(`http://${host.hostname}:${host.port}/database`, { method: "POST", body: JSON.stringify({ name: name })})).json()
    }

    async connect(){
        this.client = new WebsocketClient(this.host, this.database)
        await this.client.connect()
    }

    async getDatabase(){
        return await this.client.getDatabase()
    }

    async getDatabaseTables(){
        return await this.client.getDatabaseTables()
    }

    async createTableInDatabase(tableName, fields){
        return await this.client.createTableInDatabase(tableName, fields)
    }

    async getFromDatabaseTable(tableName, request){
        return await this.client.getFromDatabaseTable(tableName, request)
    }

    async insertToDatabaseTable(tableName, object){
        return await this.client.insertToDatabaseTable(tableName, object)
    }

    async removeFromDatabaseTable(tableName, request){
        return await this.client.removeFromDatabaseTable(tableName, request)
    }
}