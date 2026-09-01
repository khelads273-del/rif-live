const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Serve RIFI LIVE web interface directly or search for index.html file
const localIndex = path.join(__dirname, "index.html");
const parentIndex = path.join(__dirname, "..", "index.html");

app.get("/", (_, res) => {
  const indexFile = fs.existsSync(localIndex) ? localIndex : parentIndex;

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  // إذا لم يجد ملف index.html، يتم عرض الواجهة الملونة مباشرة
  return res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RIFI LIVE — Demo</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                background-color: #0b0712;
                color: #ffffff;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            .header {
                width: 100%;
                max-width: 420px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            .title-area { text-align: center; flex: 1; }
            .main-title { font-size: 24px; font-weight: 800; color: #c084fc; letter-spacing: 1px; }
            .subtitle { font-size: 13px; color: #a855f7; margin-top: 2px; }
            .profile-icon {
                width: 44px;
                height: 44px;
                background-color: #6b21a8;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .card {
                background: linear-gradient(145deg, #180f2d, #130b24);
                border-radius: 20px;
                padding: 20px;
                width: 100%;
                max-width: 420px;
                margin-bottom: 16px;
                border: 1px solid #2e1852;
                box-shadow: 0 8px 20px rgba(0,0,0,0.4);
            }
            .welcome-card { position: relative; }
            .btn-join {
                background: linear-gradient(90deg, #9333ea, #7e22ce);
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 30px;
                font-weight: bold;
                width: 100%;
                cursor: pointer;
                font-size: 16px;
                margin-top: 15px;
                box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
            }
            .section-title {
                width: 100%;
                max-width: 420px;
                font-size: 18px;
                font-weight: bold;
                margin: 15px 0 12px 0;
            }
            .room-card {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .room-title { font-size: 17px; font-weight: bold; color: #ffffff; }
            .room-info { color: #a78bfa; font-size: 13px; display: flex; gap: 8px; align-items: center; }
            .navbar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #0f091f;
                display: flex;
                justify-content: space-around;
                padding: 12px 0;
                border-top: 1px solid #23123d;
            }
            .nav-item { display: flex; flex-direction: column; align-items: center; font-size: 11px; color: #a78bfa; }
            .nav-icon { font-size: 20px; margin-bottom: 4px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="profile-icon">👤</div>
            <div class="title-area">
                <div class="main-title">RIFI LIVE 🎙️</div>
                <div class="subtitle">نسخة تجريبية مجانية</div>
            </div>
            <div style="width: 44px;"></div>
        </div>

        <div class="card welcome-card">
            <h3>مرحباً بك 👋</h3>
            <p style="color: #a78bfa; font-size: 14px; margin-top: 6px;">ادخل غرفة الصوت وجرب الهدايا والألعاب.</p>
            <button class="btn-join">دخول الغرفة 🎙️</button>
        </div>

        <div class="section-title">الغرف النشطة 🔥</div>

        <div class="card room-card">
            <div class="room-title">غرفة خالد الرسمية 👑</div>
            <div class="room-info">👥 8 / 14 • 🎁 1.2K هدية تجريبية</div>
        </div>

        <div class="card room-card">
            <div class="room-title">سهرة RIFI LIVE 🌙</div>
            <div class="room-info">👥 5 / 14 • 🎮 ألعاب</div>
        </div>

        <div class="card room-card" style="margin-bottom: 70px;">
            <div class="room-title">Gaming Room 🎮</div>
            <div class="room-info">👥 3 / 10 • 🏆 تحدي</div>
        </div>

        <div class="navbar">
            <div class="nav-item"><span class="nav-icon">🏠</span>الرئيسية</div>
            <div class="nav-item"><span class="nav-icon">🎙️</span>الغرفة</div>
            <div class="nav-item"><span class="nav-icon">🎁</span>الهدايا</div>
            <div class="nav-item"><span class="nav-icon">🎮</span>الألعاب</div>
            <div class="nav-item"><span class="nav-icon">👤</span>حسابي</div>
        </div>
    </body>
    </html>
  `);
});

app.get("/api/status", (_, res) => {
  res.json({
    app: "RIFI LIVE",
    status: "online",
    mode: "free-demo",
    payments: false,
    purchases: false,
    withdrawals: false,
    agencies: false
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = new Map();

io.on("connection", socket => {
  socket.on("joinRoom", ({ roomId, user }) => {
    if (!roomId || !user) return;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    rooms.get(roomId).set(socket.id, user);

    io.to(roomId).emit("roomState", {
      users: [...rooms.get(roomId).values()]
    });

    socket.to(roomId).emit("userJoined", user);
  });

  socket.on("chatMessage", ({ roomId, text }) => {
    if (!roomId || !text) return;

    const user = socket.data.user || { name: "مستخدم" };
    io.to(roomId).emit("systemMessage", `${user.name}: ${text}`);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    rooms.get(roomId).delete(socket.id);

    io.to(roomId).emit("roomState", {
      users: [...rooms.get(roomId).values()]
    });

    if (rooms.get(roomId).size === 0) rooms.delete(roomId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("RIFI LIVE server online on port " + PORT);
});
