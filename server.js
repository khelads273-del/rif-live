const express=require("express");
const http=require("http");
const cors=require("cors");
const {Server}=require("socket.io");

const app=express();
app.use(cors({origin:"*"}));
app.use(express.json());

app.get("/",(_,res)=>res.json({
  app:"RIFI LIVE",
  status:"online",
  mode:"free-demo",
  payments:false,
  purchases:false,
  withdrawals:false,
  agencies:false
}));

const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});
const rooms=new Map();

io.on("connection",socket=>{
  socket.on("joinRoom",({roomId,user})=>{
    if(!roomId||!user)return;
    socket.join(roomId);
    socket.data.roomId=roomId;
    socket.data.user=user;
    if(!rooms.has(roomId))rooms.set(roomId,new Map());
    rooms.get(roomId).set(socket.id,user);
    io.to(roomId).emit("roomState",{users:[...rooms.get(roomId).values()]});
    socket.to(roomId).emit("userJoined",user);
  });

  socket.on("chatMessage",({roomId,text})=>{
    if(!roomId||!text)return;
    const user=socket.data.user||{name:"مستخدم"};
    io.to(roomId).emit("systemMessage",`${user.name}: ${text}`);
  });

  socket.on("disconnect",()=>{
    const roomId=socket.data.roomId;
    if(!roomId||!rooms.has(roomId))return;
    rooms.get(roomId).delete(socket.id);
    io.to(roomId).emit("roomState",{users:[...rooms.get(roomId).values()]});
    if(rooms.get(roomId).size===0)rooms.delete(roomId);
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("RIFI LIVE server online on port "+PORT));
