
const express = require('express')
const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server;

const wss = new WebSocketServer({ port: 8080 })
const app = new express()

wss.on('close', () => {
    console.log('disconnected');
})

wss.on('connection', (ws) => {
    console.log('已连接!!!')
    ws.on('message', (e) => {
        ws.send(e)
    })
})

app.listen(3000, () => {
    console.log('Start Service on 3000');
})