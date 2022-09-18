const socket = io("/");

//PeerJsの使用
const myPeer = new Peer();

const videoWrap = document.getElementById("video__wrap");

const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};
let myVideoStream;
const user = {};

//端末のメディア情報を取得してビデオを表示する
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    //第一引数に対象となるHTML要素、第二引数にメディア情報
    addVideoStream(myVideo, stream);
    //応答処理
    myPeer.on("call", (call) => {
      //送信側に相手の画面を表示する
      call.answer(stream);
      const video = document.createElement("video");
      //新規ユーザー側にも相手の画面を表示する
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      call.on("close", () => {
        video.remove();
      });
      const userId = call.peer;
      peers[userId] = call;
    });
    //新規ユーザーが接続した時の処理
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (userId) => {
  //server.jsにイベントを送信する
  socket.emit("join-room", ROOM_ID, userId);
});
myPeer.on("disconnected", (userId) => {
  console.log("id: ", userId);
});

const connectToNewUser = (userId, stream) => {
  //userIdに対応したメディア情報を送れるようにする。
  const call = myPeer.call(userId, stream);
  //相手のビデオを出力するHTML要素を作成
  const video = document.createElement("video");

  //ビデオの送信側の処理
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoWrap.append(video);
};

//audio
const muteUnmute = (e) => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    e.classList.add("active");
    myVideoStream.getAudioTracks()[0].enabled = false;
  } else {
    e.classList.remove("active");
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

//video
const playStop = (e) => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    e.classList.add("active");
    myVideoStream.getVideoTracks()[0].enabled = false;
  } else {
    e.classList.remove("active");
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const leaveVideo = (e) => {
  socket.disconnect();
  myPeer.disconnect();
  const videos = document.getElementsByTagName("video");
  for (let i = videos.length - 1; i >= 0; --i) {
    videos[i].remove();
  }
};
