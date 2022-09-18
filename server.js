//express
const express = require("express");
const app = express();

//socket通信用のサーバーをHttpで用意
const server = require("http").Server(app);

//どのサーバーで通信するかをsocket.ioに連絡
const io = require("socket.io")(server);
//uuidを取得してuuidV4として分割代入して使用する
const { v4: uuidV4 } = require("uuid");

//サーバーの起動
server.listen(process.env.PORT || 3030);

//ejsを表示のテンプレートとして指定
app.set("view engine", "ejs");

//静的ファイルのパスを指定
app.use(express.static("public"));
//room.jsを読み込む
app.get("/", (req, res) => {
  //uuidの実行結果がパスになる。ルートパスにアクセスするとIDパスにリダイレクトされる
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  //roomのIDをroomIdとして受け取ってroom.ejsを表示する
  res.render("room", { roomId: req.params.room });
});

//socket.ioでconnectionというイベントに対して、roomIdとuserIdを受け取る
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    //新規ユーザーを追加
    socket.join(roomId);
    //roomを指定
    socket.broadcast.to(roomId).emit("user-connected", userId);
    //ユーザーの退出
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});
