const express=require("express")
const app=express()
const {Server}=require("socket.io")
const http=require("http")
const httpServer=http.createServer(app)

const {ExpressPeerServer} =require("peer")
const peerServer=ExpressPeerServer(httpServer)
app.use("/peerjs",peerServer)

app.get("/",(req,res)=>{
    res.send("<h1>File sharing App Backend Support</h1>")
})


const io=new Server(httpServer,{
    cors:{
        origin:["http://localhost:3000"]
    }
})

io.on("connection",(socket)=>{
    socket.emit("id",socket.id)

    //file sharing
    socket.on("sendFile",(data)=>{
        socket.to(data.id).emit("recieveFile",data.metadata)
        console.log(data)
    })
    socket.on("sendingFile",(data,cb)=>{
        socket.to(data.id).emit("recievingFile",data.chunk)
        cb({status:200})
    })
    socket.on("fileSent",(data)=>{
        socket.to(data.id).emit("fileReceived","Done")
    })


})



httpServer.listen(3030,()=>console.log('server is started'))