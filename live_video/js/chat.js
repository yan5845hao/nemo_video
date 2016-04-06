// 请将 AppId 改为你自己的 AppId，否则无法本地测试
var appId = 'Buvisj4avtbPyrPKtXrxLtkc-gzGzoHsz';

// 请换成你自己的一个房间的 conversation id（这是服务器端生成的）
var roomId = '56fb894fc4c97100503aefce';

// 每个客户端自定义的 id
var clientId = 'LeanCloud';

// 用来存储 realtimeObject
var rt;

// 用来存储创建好的 roomObject
var room;

// 监听是否服务器连接成功
var firstFlag = true;

// 用来标记历史消息获取状态
var logFlag = false;

var openBtn = document.getElementById('button-login-next');
var sendBtn = document.getElementById('send-btn');
var inputName = document.getElementById('input-name');
var inputSend = document.getElementById('input-send');
var printWall = document.getElementById('print-wall');

// 拉取历史相关
// 最早一条消息的时间戳
var msgTime;

bindEvent(openBtn, 'click', main);
bindEvent(sendBtn, 'click', sendMsg);

bindEvent(document.body, 'keydown', function(e) {
  if (e.keyCode === 13) {
    if (firstFlag) {
      main();
    } else {
      sendMsg();
    }
  }
});

function main() {
  var val = inputName.value;
  // 不让发送空字符
  if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
    alert('昵称不能为空哦！');
    return;
  }
  showChatContent();
  setHeight();
  if(val){
    clientId = val;
  }
  if (!firstFlag) {
    rt.close();
  }

  // 创建实时通信实例
  rt = AV.realtime({
    appId: appId,
    clientId: clientId,

    // 请注意，这里关闭 secure 完全是为了 Demo 兼容范围更大些
    // 具体请参考实时通信文档中的「其他兼容问题」部分
    // 如果真正使用在生产环境，建议不要关闭 secure，具体阅读文档
    // secure 设置为 true 是开启
    secure: true
  });

  // 监听连接成功事件
  rt.on('open', function() {
    firstFlag = false;
    showLog('欢迎加入小鱼直播问答!');

    // 获得已有房间的实例
    rt.room(roomId, function(object) {

      // 判断服务器端是否存在这个 room，如果存在
      if (object) {
        room = object;

        // 当前用户加入这个房间
        room.join(function() {

          // 获取成员列表
          room.list(function(data) {
            if(data&&data.length){
              var l = data.length;
              // 如果超过 500 人，就踢掉一个。
              if (l > 490) {
                room.remove(data[30], function() {
                  showLog('人数过多，踢掉： ', data[30]);
                });
              }
            }

            //// 获取聊天历史
            //getLog(function() {
            //  printWall.scrollTop = printWall.scrollHeight+printWall.offsetHeight;
            //  //showLog('已经加入，可以开始聊天。');
            //});
          });

        });

        // 房间接受消息
        room.receive(function(data) {
          if (!msgTime) {
            // 存储下最早的一个消息时间戳
            msgTime = data.timestamp;
          }
          showMsg(data);
        });
      } else {
        // 如果服务器端不存在这个 conversation
        showLog('服务器不存在这个 conversation，你需要创建一个。');

        // 创建一个新 room
        rt.room({
          // Room 的默认名字
          name: 'LeanCloud-Room',

          // 默认成员的 clientId
          members: [
            // 当前用户
            clientId
          ],
          // 创建暂态的聊天室（暂态聊天室支持无限人员聊天，但是不支持存储历史）
          // transient: true,
          // 默认的数据，可以放 Conversation 名字等
          attr: {
            test: 'demo2'
          }
        }, function(obj) {

          // 创建成功，后续你可以将 room id 存储起来
          room = obj;
          roomId = room.id;
          showLog('创建一个新 Room 成功，id 是：', roomId);

          // 关闭原连接，重新开启新连接
          rt.close();
          main();
        });
      }
    });
  });

  // 监听服务情况
  rt.on('reuse', function() {
    showLog('服务器正在重连，请耐心等待。。。');
  });

  // 监听错误
  rt.on('error', function() {
    showLog('连接遇到错误。。。');
  });
}
//
function showChatContent(){
//  隐藏下一步
//  隐藏昵称按钮
  document.getElementById("chat-login").style.display="none";
  document.getElementById("chat-content").style.display="block";
}

function showChatContent(){
//  隐藏下一步
//  隐藏昵称按钮
  document.getElementById("chat-login").style.display="none";
  document.getElementById("chat-content").style.display="block";
}


function setHeight(){
  //        给问答对话框设置高度
  var heightTotal= document.documentElement.clientHeight;
  var posterHeight =document.getElementById("poster").offsetHeight;
  var footerHeight = document.getElementById("chat-footer").offsetHeight;
  var chatContentH = heightTotal-posterHeight-footerHeight-70;//40是nav的高度,25是margin的,再减去5px机动空白
  document.getElementById("print-wall").style.height = chatContentH+"px";
}

function sendMsg() {

  // 如果没有连接过服务器
  if (firstFlag) {
    alert('请先连接服务器！');
    return;
  }
  var val = inputSend.value;

  // 不让发送空字符
  if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
    alert('先说点什么吧！');
    return;
  }

  // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
  room.send({
    text: val
  }, {
    type: 'text'
  }, function(data) {
    // 发送成功之后的回调
    inputSend.value = '';
    //showLog('（' + formatTime(data.t) + ') '+data.peerId.toString()+':', val);
    showChat(data.peerId.toString(),formatTime(data.t),val);
    printWall.scrollTop = printWall.scrollHeight;
  });

}

// 显示接收到的信息
function showMsg(data, isBefore) {
  var text = '';
  var from = data.fromPeerId;
  if (data.msg.type) {
    text = data.msg.text;
    if(data.msg.type=="image"){
      var imgUrl=data.msg.url;
    }
  } else {
    text = data.msg;
  }
  if (String(text).replace(/^\s+/, '').replace(/\s+$/, '')) {
    showChat(encodeHTML(from),formatTime(data.timestamp),text,isBefore);
  }
  //加上滚动条,让消息能够自动刷新!
  printWall.scrollTop = printWall.scrollHeight;
}

// 拉取历史
bindEvent(printWall, 'scroll', function(e) {
  if (printWall.scrollTop < 20) {
    getLog();
  }
});

// 获取消息历史
function getLog(callback) {
  var height = printWall.scrollHeight;
  if (logFlag) {
    return;
  } else {
    // 标记正在拉取
    logFlag = true;
  }
  room.log({
    t: msgTime
  }, function(data) {
    logFlag = false;
    // 存储下最早一条的消息时间戳
    var l = data.length;
    if (l) {
      msgTime = data[0].timestamp;
    }
    for (var i = l - 1; i >= 0; i--) {
      showMsg(data[i], true);
    }
    if (l) {
      printWall.scrollTop = printWall.scrollHeight - height;
    }
    if (callback) {
      callback();
    }
  });
}
//demo中输出信息
function showChat(user,time,msg,isBefore){
  var p = document.createElement('p');
  p.class="chat-bar";
  p.innerHTML = '<span class="chat-user">'+user+'</span>'+'<span class="chat-time">'+time+'</span>'+'<br/>'+
      '<span class="chat-detail">'+msg+'</span>';
  if(isBefore){
    printWall.insertBefore(p,printWall.childNodes[0]);
  }
  else {
    printWall.appendChild(p);
  }
}

// demo 中输出代码
function showLog(msg, data, isBefore) {
  if (data) {
    // console.log(msg, data);

    msg = msg + '<span class="strong">' + encodeHTML(JSON.stringify(data)).replace(/\"/g,"") + '</span>';
  }
  var p = document.createElement('p');
  p.innerHTML = msg;
  if (isBefore) {
    printWall.insertBefore(p, printWall.childNodes[0]);
  } else {
    printWall.appendChild(p);
  }
}

function encodeHTML(source) {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // .replace(/\\/g,'&#92;')
  // .replace(/"/g,'&quot;')
  // .replace(/'/g,'&#39;');
}

function formatTime(time) {
  var date = new Date(time);
  var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return hh + ':' + mm + ':' + ss;
}

function bindEvent(dom, eventName, fun) {
  if (window.addEventListener) {
    dom.addEventListener(eventName, fun);
  } else {
    dom.attachEvent('on' + eventName, fun);
  }
}
