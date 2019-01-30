

var myClient = {};
myClient.id = null;


$(function() {


	var socket = io.connect();

	// ###########################################
	// テレメ
	// socket.on("server_to_client", function(data){appendMsg(data.value)});
	socket.on("s2p_MAIN_TELEMETRY",     function(data){AnalyzeMainTelemetry(data.value)});
	socket.on("s2p_NOTICE_ID",          function(data){SetId(data.value)});
	socket.on("s2p_LS_DATA",            function(data){AppendLsLog(data.value)});
	socket.on("s2p_CAMERA_DATA",        function(data){UpdateCamera(data.value)});
	socket.on("s2p_SERVER_CONSOLE_MSG", function(data){AppendConsoleMsg(data.value, "#serverConsoleLogs")});
	socket.on("s2p_ROBOT_CONSOLE_MSG",  function(data){AppendConsoleMsg(data.value, "#RobotConsoleLogs")});
	socket.on("s2p_MIC_RAW_DATA",       function(data){
		// console.log(data.value);
		var arr = new Int16Array(data.value);
		var arrf = new Float32Array(arr.length);
		// console.log(arr);
		// console.log("####");
		// 正規化
		for (var i=0; i<arr.length; i++) {		// 16bit音声なので！！
			arrf[i] = arr[i] / 32768.0;
		}
		mic_PlayAudioStream(arrf);
	});


	// 接続
	socket.on('connect', function(){
		console.log("CONNCT!!");
		// console.log(socket);
		// console.log(socket.id);
		console.log(socket.connected);
		// 中継サーバーに自身を登録
		var client = {
			id      : null,
			type    : 'pc',
			connect : null,
		}
		socket.emit('p2s_PC_REGISTER', {value : client});
	});

	// 切断
	socket.on('disconnect', function(socket){
		console.log("DISCONNCT!!");
		// console.log(socket);
		// console.log(socket.id);
		console.log(socket.connected);
	});


	// ロボットとの接続・切断
	$('#serverConnectedRobot').on('click', '.robot-connect', function() {
		// console.log(this);
		// console.log($(this).attr('name'));
		var id = $(this).attr('name');
		socket.emit('p2s_CONNECT_TO_ROBOT', {value : id});
	});
	$('#serverConnectedRobot').on('click', '.robot-disconnect', function() {
		// console.log(this);
		// console.log($(this).attr('name'));
		var id = $(this).attr('name');
		socket.emit('p2s_DISCONNECT_TO_ROBOT', {value : id});
	});

	// ###########################################
	// コマンド
	$("button#motorOn").on('click', function() {
		socket.emit("p2s_MOTOR_ON", null);
	});
	$("button#motorOff").on('click', function() {
		socket.emit("p2s_MOTOR_OFF", null);
	});
	$("button#motorGoF").on('click', function() {
		socket.emit("p2s_MOTOR_GO_F", null);
	});
	$("button#motorGoB").on('click', function() {
		socket.emit("p2s_MOTOR_GO_B", null);
	});
	$("button#motorStop").on('click', function() {
		socket.emit("p2s_MOTOR_STOP", null);
	});
	$("button#motorTurnR").on('click', function() {
		socket.emit("p2s_MOTOR_TURN_R", null);
	});
	$("button#motorTurnL").on('click', function() {
		socket.emit("p2s_MOTOR_TURN_L", null);
	});

	$("button#ledOn").on('click', function() {
		socket.emit("p2s_LED_ON", null);
	});
	$("button#ledOff").on('click', function() {
		socket.emit("p2s_LED_OFF", null);
	});

	$("button#cameraOn").on('click', function() {
		socket.emit("p2s_CAMERA_ON", null);
	});
	$("button#cameraOff").on('click', function() {
		socket.emit("p2s_CAMERA_OFF", null);
	});

	$("button#lightSensorSingle").on('click', function() {
		socket.emit("p2s_LS_SINGLE", null);
	});
	$("button#lightSensorSeqBegin").on('click', function() {
		socket.emit("p2s_LS_SEQ_BEGIN", null);
	});
	$("button#lightSensorSeqEnd").on('click', function() {
		socket.emit("p2s_LS_SEQ_END", null);
	});

	$("button#micOn").on('click', function() {
		console.log("p2s_MIC ON");
		socket.emit("p2s_MIC_ON", null);
	});
	$("button#micOff").on('click', function() {
		console.log("p2s_MIC OFF");
		socket.emit("p2s_MIC_OFF", null);
	});




});



function AnalyzeMainTelemetry(data) {
	clients = data.connectedClients;
	$("#serverConnectedPc").empty();
	$("#serverConnectedRobot").empty();
	for (var key in clients) {
		var client = clients[key];
		if (client.type == 'pc') {
			$("#serverConnectedPc").prepend('<p class="col-12 d-flex align-items-center my-p-btn">' + client.id + '</p>');
		} else if (client.type == 'robot') {
			if (client.connect == myClient.id) {
				// 自分と接続されている
				$("#serverConnectedRobot").prepend('\
					<p class="col-6 d-flex align-items-center my-p-btn">' +  client.id + '</p>\
					<div class="col-6 btn-group btn-group-toggle" data-toggle="buttons">\
						<label name="' + client.id + '" class="robot-connect col-6 btn btn-danger active">\
							<input type="radio" autocomplete="off" checked>接続\
						</label>\
						<label name="' + client.id + '" class="robot-disconnect col-6 btn btn-danger">\
							<input type="radio" autocomplete="off">切断\
						</label>\
					</div>\
				');
			} else {
				$("#serverConnectedRobot").prepend('\
					<p class="col-6 d-flex align-items-center my-p-btn">' +  client.id + '</p>\
					<div class="col-6 btn-group btn-group-toggle" data-toggle="buttons">\
						<label name="' + client.id + '" class="robot-connect col-6 btn btn-danger">\
							<input type="radio" autocomplete="off">接続\
						</label>\
						<label name="' + client.id + '" class="robot-disconnect col-6 btn btn-danger active">\
							<input type="radio" autocomplete="off" checked>切断\
						</label>\
					</div>\
				');
			}
		}
	}
}

function AppendLsLog(data) {
	var MAX_LENGTH = 20;

	// console.log(text);
	// $("#lightSensorLogs").append("<p>" + text + "</p>");
	// $("#lightSensorLogs").prepend("<p>" + data.lt + "</p>");
	strtime = data.time.hours + ":" + data.time.minutes + ":" + data.time.seconds;
	lts     = data.lt.split(" ")
	// console.log(lts);

	myChartLt.data.labels.push(strtime);
	for (var i = 0;  i < 4;  i++) {
		myChartLt.data.datasets[i].data.push(lts[i])
	}

	console.log(myChartLt.data.labels.length);
	if (myChartLt.data.labels.length > MAX_LENGTH) {
		myChartLt.data.labels.shift();
		for (var i = 0;  i < 4;  i++) {
			myChartLt.data.datasets[i].data.shift()
		}
	}

	myChartLt.update();
}

function UpdateCamera(data) {
	// console.log(data);
	console.log(data.length);
	$("#cameraCapture").attr('src', data);
}

function AppendConsoleMsg(text, id) {
	// console.log(text);
	$(id).prepend("<p>" + text + "</p>");
}

function SetId(id) {
	myClient.id = id;
}


// ###########################################
// マイク
var mic_ctx = new (window.AudioContext||window.webkitAudioContext);
var mic_initial_delay_sec = 0;
var mic_scheduled_time = 0;

function mic_PlayChunk(audio_src, mic_scheduled_time) {
	if (audio_src.start) {
		audio_src.start(mic_scheduled_time);
	} else {
		audio_src.noteOn(mic_scheduled_time);
	}
}
function mic_PlayAudioStream(audio_f32) {
	var audio_buf = mic_ctx.createBuffer(1, audio_f32.length, 44100),
		audio_src = mic_ctx.createBufferSource(),
		current_time = mic_ctx.currentTime;

	audio_buf.getChannelData(0).set(audio_f32);

	audio_src.buffer = audio_buf;
	audio_src.connect(mic_ctx.destination);

	if (current_time < mic_scheduled_time) {
		mic_PlayChunk(audio_src, mic_scheduled_time);
		mic_scheduled_time += audio_buf.duration;
	} else {
		mic_PlayChunk(audio_src, current_time);
		mic_scheduled_time = current_time + audio_buf.duration + mic_initial_delay_sec;
	}
}





// ###########################################
// グラフ
var myChartLt;
window.onload = function() {
	var chartLtCnv = document.getElementById("lightSensorChart").getContext("2d");
	myChartLt = new Chart(chartLtCnv, {
		type: 'line',
		data: ltData,
		options: chartLtOption
	});
};


var chartLtOption = {
	responsive: true,
	scales: {
		xAxes: [{
//			display: true,
			scaleLabel: {
				display: true,
				labelString: 'time []',
//				fontFamily: 'monospace',
//				fontSize: 14
			},
//			stacked: false,
//			gridLines: {
//				display: false
//			}
		}],
		yAxes: [{
			id: "y-axis-1",
			position: "left",
//			display: true,
			scaleLabel: {
				display: true,
				labelString: 'Light Sensor []',
//				fontFamily: 'monospace',
//				fontSize: 14
			},
		}]
	}
};


var ltData = {
	labels: [],
	datasets: [
	{
		label: 'LT0',
		yAxisID: "y-axis-1",
		data: [],
		borderColor : "rgba(254,97,132,0.8)",
		backgroundColor : "rgba(254,97,132,0.5)",
		pointRadius : 2,
		borderWidth : 1.5,
		tension: 0,
		fill: false,
	},
	{
		label: 'LT1',
		yAxisID: "y-axis-1",
		data: [],
		borderColor : "rgba(54,103,235,0.8)",
		backgroundColor : "rgba(54,103,235,0.5)",
		pointRadius : 2,
		borderWidth : 1.5,
		tension: 0,
		fill: false,
	},
	{
		label: 'LT2',
		yAxisID: "y-axis-1",
		data: [],
		borderColor : "rgba(206,195,73,0.8)",
		backgroundColor : "rgba(206,195,73,0.5)",
		pointRadius : 2,
		borderWidth : 1.5,
		tension: 0,
		fill: false,
	},
	{
		label: 'T3',
		yAxisID: "y-axis-1",
		data: [],
		borderColor : "rgba(206,125,95,0.8)",
		backgroundColor : "rgba(206,125,95,0.5)",
		pointRadius : 2,
		borderWidth : 1.5,
		tension: 0,
		fill: false,
	},
	],
};

