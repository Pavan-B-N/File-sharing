const express=require("express")
const app=express()
const port=process.env.PORT || 3030;
const {Server}=require("socket.io")
const http=require("http")
const httpServer=http.createServer(app)

const {ExpressPeerServer} =require("peer")
const peerServer=ExpressPeerServer(httpServer)
app.use("/peerjs",peerServer)

app.get("/",(req,res)=>{
    res.send("<h1>File sharing App Backend Support</h1>")
})


const availableUsers=[]
function isUserExists(username){
    const promise=new Promise((resolve)=>{
        availableUsers.forEach((user)=>{
            if(user.username==username){
                return resolve(true)
            }
        })
        resolve(false)
    })
    return promise
}
function removeUserBySocketId(id){
    availableUsers.forEach((user,index)=>{
        if(user.id==id){
            availableUsers.splice(index,1)
        }
    })
}
const io=new Server(httpServer,{
    cors:{
        origin:"*"
        // origin:["http://localhost:3000","https://fileshareapp.netlify.app/","http://192.168.0.147:3000"]
    }
})

io.on("connection",(socket)=>{
    socket.emit("id",socket.id)
    socket.on("join",async (name,cb)=>{
        const isExists=await isUserExists(name)
        if(!isExists){
            availableUsers.push({username:name,id:socket.id})
            socket.broadcast.emit("availableUsers",availableUsers)
            cb({status:200,msg:"user joined successfully"})
        }else{
            cb({status:403,msg:'user exists'})
        }
    })
    socket.on("disconnect",()=>{
        removeUserBySocketId(socket.id)
        socket.broadcast.emit("availableUsers",availableUsers)
    })
    socket.emit("availableUsers",availableUsers)
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



httpServer.listen(port,()=>console.log(`server is started with port ${port}`))