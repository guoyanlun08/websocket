const ModeCode = {  //websocket消息类型
    MSG: 'message',  //普通消息
    HEART_BEAT: 'heart_beat'  //心跳
}

const HEARTBEATCONFIG = {  //time：心跳时间间隔 timeout：心跳超时间隔 reconnect：断线重连时
    time: 10 * 1000,
    timeout: 3 * 1000,
    reconnect: 10 * 1000
}
const LIMIT_TIME = 5

class Ws {
    constructor(url, heartBeatConfig = HEARTBEATCONFIG) {
        this.url = url
        this.limit_time = LIMIT_TIME
        this.lockReconnect = false  //避免重复连接
        this.ws = new WebSocket(this.url)
        this.init(heartBeatConfig)
    }

    init(heartBeatConfig) {
        this.webSocketState = false
        this.heartBeat = heartBeatConfig
        this.startHeartBeat(this.heartBeat.time)
        // 成功连接回调
        this.ws.onopen = (e) => {
            console.log('客户端连接成功', e);
            this.webSocketState = true
            this.limit_time = LIMIT_TIME
        }
        // 从服务端收到信息回调
        this.ws.onmessage = async (e) => {
            const data = await getMsg(e.data)
            switch(data.ModeCode) {
                case ModeCode.HEART_BEAT:
                    this.webSocketState = true
                    console.log('收到服务端心跳', this.webSocketState)
                    break;
            }
        }
        // 断连回调
        this.ws.onclose = (e) => {
            console.log('客户端关闭连接', e);
            this.webSocketState = false
        }
        // 出错回调
        this.ws.onerror = (e) => {
            console.log('客户端连接出错', e);
            this.webSocketState = false
            this.reconnectWebSocket()
        }
    }


    // 重连机制  todo: 未测试
    reconnectWebSocket() {
        if(this.lockReconnect) {
            return
        }
        this.lockReconnect = true
        if(this.limit_time >= 0) {
            let tt
            tt && clearTimeout(tt)
            tt = setTimeout(()=>{
                this.limit_time--
                this.lockReconnect = false
                this.ws = new WebSocket(this.url)
                this.init(heartBeatConfig)
            }, 4000)
        }
    }

    // 心跳机制
    startHeartBeat(time) {
        setTimeout(() => {
            const data = {
                ModeCode: ModeCode.HEART_BEAT,
                msg: new Date()
            }
            this.send(data)
            this.waitingServer()
        }, time)
    }
    waitingServer() {
        this.webSocketState = false
        setTimeout(() => {
            if(this.webSocketState) {
                this.startHeartBeat(this.heartBeat.time)
                return
            }
            console.log('心跳无响应，已断线')
            this.close()
        }, this.heartBeat.timeout);
    }

    close() {
        this.ws.close()
    }
    send(data) {
        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(sendMsg(data))
        }
    }
}

function sendMsg(obj) {
    return JSON.stringify(obj)
}

async function getMsg(blob) {
    const data = await blob.text()
    return JSON.parse(data)
}