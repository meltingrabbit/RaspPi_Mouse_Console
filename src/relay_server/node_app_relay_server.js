var http     = require('http');
var socketio = require('socket.io');
var path     = require('path');
var fs       = require('fs');
var mime     = {
	".html": "text/html",
	".js":   "application/javascript",
	".css":  "text/css",
	// 読み取りたいMIMEタイプはここに追記
};


var server_ws_main = http.createServer(function(req, res) {
	var file_path = '';
	if (req.url == '/') {
		file_path = '/pimouse.html';			// 仮
	} else {
		file_path = req.url;
	}

	var full_path = __dirname + file_path;
	console.log('FullPath : ' + full_path);

	res.writeHead(200, {"Content-Type": mime[path.extname(full_path)] || "text/plain"});
	fs.readFile(full_path, function(err, data) {
		if (err) {
			// エラー時の応答
		} else {
			res.end(data, 'UTF-8');
		}
	});
}).listen(3000);
console.log('WS Main Server running at http://localhost:3000/');


var io = socketio.listen(server_ws_main);


// 接続client一覧
var connected_clients = {};		// IDによるハッシュ
/*
この要素のclientは，
id : socket id
type : pc or robot
connect : 接続されている先
*/


io.sockets.on('connection', function(socket) {

	DispConsole('A connection with the client has been established!');
	DispConsole('ID: ' + socket.id);
	DispConsole(socket.connected);

	var client = {};			// とりあえず，自分のIDを保持するのに使う

	// メインテレメトリーを周期的に配送する
	setInterval(SendMainTelemetry, 1000);


	socket.on('disconnect', function(socket) {
		DispConsole('Disconnected from the client!');
		DispConsole('ID: ' + socket.id);
		DispConsole('id: ' + client.id);
		DispConsole(socket.connected);
		UnregisterClient(client.id);
	});


	socket.on('r2s_ROBOT_REGISTER', function(data) {
		client         = data.value;
		client.id      = data.value.id;
		client.connect = null;
		RegisterClient(client);
	});

	socket.on('p2s_PC_REGISTER', function(data) {
		io.to(socket.id).emit('s2p_NOTICE_ID', {value : socket.id});
		client         = data.value;
		client.id      = socket.id;
		client.connect = null;
		RegisterClient(client);
	});


	// PC - ROBOT 接続，切断
	socket.on('p2s_CONNECT_TO_ROBOT', function(data) {
		var robot_id = data.value;
		var pc_id    = client.id;

		if (connected_clients[robot_id]) {
			connected_clients[robot_id].connect = pc_id;
			io.to(robot_id).emit('s2r_CONNECT_TO_PC', null);
		}
		if (connected_clients[pc_id]) {
			connected_clients[pc_id].connect = robot_id;
		}

		CheckConnectedClients();
	});
	socket.on('p2s_DISCONNECT_TO_ROBOT', function(data) {
		var robot_id = data.value;
		var pc_id    = client.id;

		io.to(robot_id).emit('s2r_DISCONNECT_TO_PC', null);

		UnsetConnect(robot_id);
		UnsetConnect(pc_id);

		CheckConnectedClients();
	});


	// ###########################################
	// pc → server
	socket.on('p2s_MOTOR_ON', function(data) {
		DispConsole('p2s_MOTOR_ON');
		EmitSocketToConnect(client.id, 's2r_MOTOR_ON', null);
	});
	socket.on('p2s_MOTOR_OFF', function(data) {
		DispConsole('p2s_MOTOR_OFF');
		EmitSocketToConnect(client.id, 's2r_MOTOR_OFF', null);
	});
	socket.on('p2s_MOTOR_GO_F', function(data) {
		DispConsole('p2s_MOTOR_GO_F');
		EmitSocketToConnect(client.id, 's2r_MOTOR_GO_F', null);
	});
	socket.on('p2s_MOTOR_GO_B', function(data) {
		DispConsole('p2s_MOTOR_GO_B');
		EmitSocketToConnect(client.id, 's2r_MOTOR_GO_B', null);
	});
	socket.on('p2s_MOTOR_STOP', function(data) {
		DispConsole('p2s_MOTOR_STOP');
		EmitSocketToConnect(client.id, 's2r_MOTOR_STOP', null);
	});
	socket.on('p2s_MOTOR_TURN_R', function(data) {
		DispConsole('p2s_MOTOR_TURN_R');
		EmitSocketToConnect(client.id, 's2r_MOTOR_TURN_R', null);
	});
	socket.on('p2s_MOTOR_TURN_L', function(data) {
		DispConsole('p2s_MOTOR_TURN_L');
		EmitSocketToConnect(client.id, 's2r_MOTOR_TURN_L', null);
	});


	socket.on('p2s_LED_ON', function(data) {
		DispConsole('p2s_LED_ON');
		EmitSocketToConnect(client.id, 's2r_LED_ON', null);
	});
	socket.on('p2s_LED_OFF', function(data) {
		DispConsole('p2s_LED_OFF');
		EmitSocketToConnect(client.id, 's2r_LED_OFF', null);
	});

	socket.on('p2s_CAMERA_ON', function(data) {
		DispConsole('s2r_CAMERA_ON');
		EmitSocketToConnect(client.id, 's2r_CAMERA_ON', null);
	});
	socket.on('p2s_CAMERA_OFF', function(data) {
		DispConsole('s2r_CAMERA_OFF');
		EmitSocketToConnect(client.id, 's2r_CAMERA_OFF', null);
	});

	socket.on('p2s_LS_SINGLE', function(data) {
		DispConsole('s2r_LS_SINGLE');
		EmitSocketToConnect(client.id, 's2r_LS_SINGLE', null);
	});
	socket.on('p2s_LS_SEQ_BEGIN', function(data) {
		DispConsole('s2r_LS_SEQ_BEGIN');
		EmitSocketToConnect(client.id, 's2r_LS_SEQ_BEGIN', null);
	});
	socket.on('p2s_LS_SEQ_END', function(data) {
		DispConsole('s2r_LS_SEQ_END');
		EmitSocketToConnect(client.id, 's2r_LS_SEQ_END', null);
	});

	socket.on('p2s_MIC_ON', function(data) {
		DispConsole('p2s_MIC_ON');
		EmitSocketToConnect(client.id, 's2r_MIC_ON', null);
	});
	socket.on('p2s_MIC_OFF', function(data) {
		DispConsole('p2s_MIC_OFF');
		EmitSocketToConnect(client.id, 's2r_MIC_OFF', null);
	});



	socket.on('p2s_SPEAKER_ON', function(data) {
		DispConsole('p2s_MIC_OFF');
		EmitSocketToConnect(client.id, 's2r_SPEAKER_ON', null);
	});
	socket.on('p2s_SPEAKER_OFF', function(data) {
		DispConsole('p2s_MIC_OFF');
		EmitSocketToConnect(client.id, 's2r_SPEAKER_OFF', null);
	});

	socket.on('p2s_SPEAKER_RAW_DATA', function(data) {
		// DispConsole('p2s_SPEAKER_RAW_DATA');
		EmitSocketToConnect(client.id, 's2r_SPEAKER_RAW_DATA', {value : data.value});
		// console.log(data);
	});





	// ###########################################
	// robot → client
	socket.on('r2s_LS_DATA', function(data) {
		DispConsole('s2p_LS_DATA');
		EmitSocketToConnect(client.id, 's2p_LS_DATA', {value : data.value});
	});

	socket.on('r2s_CAMERA_DATA', function(data) {
		DispConsole('s2p_CAMERA_DATA');
		EmitSocketToConnect(client.id, 's2p_CAMERA_DATA', {value : data.value});
	});

	socket.on('r2s_MIC_RAW_DATA', function(data) {
		DispConsole('s2p_MIC_RAW_DATA');
		EmitSocketToConnect(client.id, 's2p_MIC_RAW_DATA', {value : data.value});
	});

	socket.on('r2s_ROBOT_CONSOLE_MSG', function(data) {
		EmitSocketToConnect(client.id, 's2p_ROBOT_CONSOLE_MSG', {value : data.value});
	});
});



function RegisterClient(client) {
	connected_clients[client.id] = client;
}

function UnregisterClient(id) {
	ResetRobot(id);
	if (connected_clients[id]) {
		if (connected_clients[id].connect != null) {
			ResetRobot(connected_clients[id].connect);
		}
	}
	delete connected_clients[id];
}


function UnsetConnect(id) {
	ResetRobot(id);
	if (connected_clients[id]) {
		ResetRobot(connected_clients[id].connect);
		connected_clients[id].connect = null;
	}
}

function EmitSocketToConnect(id, event, data) {
	if (connected_clients[id]) {
		if (connected_clients[id].connect != null) {
			io.to(connected_clients[id].connect).emit(event, data);
		} else {
			DispConsole('Not Connected!');
		}
	}
}


function SendMainTelemetry() {
	var data = {};
	data.connected_clients = connected_clients;
	io.sockets.emit('s2p_MAIN_TELEMETRY', {value : data});
}


function CheckConnectedClients() {
	// 存在しない接続先や，クライアントがあれば削除
	// console.log(Object.keys(io.sockets.sockets));
	console.log(connected_clients);
	var existSockets = Object.keys(io.sockets.sockets);
	for (var id in connected_clients) {
		if (connected_clients[id]) {
			// OK
			if (connected_clients[ connected_clients[id].connect ]) {
				// OK
			} else {
				// 接続先が存在しない
				UnsetConnect(id)
			}

			if (connected_clients[id].connect) {
				// 接続先があって，
				if (connected_clients[ connected_clients[id].connect ].connect == id) {
					// OK
				} else {
					// 自分が繋げてると思ってる相手が自分とつながっていない
					UnsetConnect(id);
				}
			}
		} else {
			// 接続元が存在しない
			UnregisterClient(id)
		}
	}
}


function ResetRobot(id) {
	// 切断時などにリセット信号を送る
	if (id != null) {
		io.to(id).emit('s2r_RESET', null);
	}
}


function DispConsole(text, id, sendFlag = 1) {
	console.log(text);
	if (sendFlag == 1) {
		io.sockets.emit('s2p_SERVER_CONSOLE_MSG', {value : GetTimeStamp() + ' ' + text});
	}
}


function GetTimeStamp() {
	var now = new Date();
	// return '[' + now.toLocaleString() + ']';
	var year    = now.getFullYear();
	var month   = now.getMonth()+1;
	var date    = now.getDate();
	var hours   = now.getHours();
	var minutes = now.getMinutes();
	var seconds = now.getSeconds();
	return '[' + year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds  + ']';
}
