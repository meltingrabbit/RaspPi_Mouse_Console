
// settings
var IP_RELAY_SERVER = '192.168.10.120';
// var IP_RELAY_SERVER = '192.168.100.108';

// web camera
var node_webcam  = require('node-webcam');
// ↓ロジクールカメラC270 HD WEBCAM
var opts_camera = {
	// サイズがかえられない？？
	// width:          32,
	// height:         24,
	// delay:          0,
	// quality:        80,
	callbackReturn: "base64"
};
// ↓ちっこいカメラ LOAS MCM-15W
// var opts_camera = {
// 	width:          320,
// 	height:         240,
// 	callbackReturn: "base64"
// };


// マイク
var fs  = require('fs');
var mic = require('mic');
var pcm = require('pcm');
var mic_instance;


// var client_ws_main = io.connect('http://192.168.10.134:3000');
var socket = require('socket.io-client')('http://' + IP_RELAY_SERVER + ':3000');


// 接続確立
socket.on('connect', function(){
	// 中継サーバーに自身を登録
	var client = {
		id      : socket.id,
		type    : 'robot',
		connect : null,
	}
	socket.emit('r2s_ROBOT_REGISTER', {value : client});

	DispConsole('Connected from the relay server!');
	DispConsole('ID: ' + socket.id);
	DispConsole(socket.connected);
});

// 切断
socket.on('disconnect', function() {
	DispConsole('Disconnected from the relay server!');
	DispConsole('ID: ' + socket.id);
	DispConsole(socket.connected);
	ResetRobot();
});



// タイマー変数の初期化
var timer_lt = {
	id : null,
	is_on : 0,
}
var timer_camera = {
	id : null,
	is_on : 0,
}
// 状態量変数の初期化
var status_mic = {
	is_on : 0,
}


socket.on('s2r_CONNECT_TO_PC', function(data) {
	DispConsole('Connect to pc!');
});
socket.on('s2r_DISCONNECT_TO_PC', function(data) {
	DispConsole('Disconnect to pc!');
});


socket.on('s2r_RESET', function(data) {
	ResetRobot();
});


var motor_default_val = 1000;
socket.on('s2r_MOTOR_ON', function(data) {
	DispConsole('s2r_MOTOR_ON');
	PowerOnMotor();
});
socket.on('s2r_MOTOR_OFF', function(data) {
	DispConsole('s2r_MOTOR_OFF');
	SetMotorRaw(0, 0);
	PowerOffMotor();
});
socket.on('s2r_MOTOR_GO_F', function(data) {
	DispConsole('s2r_MOTOR_GO_F');
	SetMotorRaw(motor_default_val, motor_default_val);
});
socket.on('s2r_MOTOR_GO_B', function(data) {
	DispConsole('s2r_MOTOR_GO_B');
	SetMotorRaw(-motor_default_val, -motor_default_val);
});
socket.on('s2r_MOTOR_STOP', function(data) {
	DispConsole('s2r_MOTOR_STOP');
	SetMotorRaw(0, 0);
});
socket.on('s2r_MOTOR_TURN_R', function(data) {
	DispConsole('s2r_MOTOR_TURN_R');
	SetMotorRaw(-motor_default_val, motor_default_val);
});
socket.on('s2r_MOTOR_TURN_L', function(data) {
	DispConsole('s2r_MOTOR_TURN_L');
	SetMotorRaw(motor_default_val, -motor_default_val);
});


socket.on('s2r_LED_ON', function(data) {
	// console.log(data);
	console.log('s2r_LED_ON');
	OnLed();
});
socket.on('s2r_LED_OFF', function(data) {
	// console.log(data);
	console.log('s2r_LED_OFF');
	OffLed();
});

socket.on('s2r_CAMERA_ON', function(data) {
	console.log('s2r_CAMERA_ON');
	if (timer_camera.is_on == 0) {
		timer_camera.id = setInterval(SendCameraCapture, 2500);
		// timer_camera.id = setInterval(SendCameraCapture, 200);
	}
	timer_camera.is_on = 1;
});
socket.on('s2r_CAMERA_OFF', function(data) {
	if (timer_camera.is_on == 1) {
		clearInterval(timer_camera.id);
	}
	timer_camera.is_on = 0;
});

socket.on('s2r_MIC_ON', function(data) {
	console.log('s2r_MIC_ON');
	if (status_mic.is_on == 0) {
		InitMic();
		StartMic();
	}
	status_mic.is_on = 1;
});
socket.on('s2r_MIC_OFF', function(data) {
	if (status_mic.is_on == 1) {
		StpoMic();
	}
	status_mic.is_on = 0;
});

socket.on('s2r_LS_SINGLE', function(data) {
	SendLtValue();
});
socket.on('s2r_LS_SEQ_BEGIN', function(data) {
	if (timer_lt.is_on == 0) {
		timer_lt.id = setInterval(SendLtValue, 1000);
	}
	timer_lt.is_on = 1;
});
socket.on('s2r_LS_SEQ_END', function(data) {
	if (timer_lt.is_on == 1) {
		clearInterval(timer_lt.id);
	}
	timer_lt.is_on = 0;
});



function ResetRobot() {
	if (timer_lt.is_on == 1) {
		clearInterval(timer_lt.id);
	}
	if (timer_camera.is_on == 1) {
		clearInterval(timer_camera.id);
	}
	timer_lt.is_on = 0;
	timer_camera.is_on = 0;
	SetMotorRaw(0, 0);
	PowerOffMotor();
	OffLed();
}


// ########## LED ##########
// LED ON
function OnLed() {
	// shell実行（非同期）
	// http://tkybpp.hatenablog.com/entry/2016/04/25/163246
	const exec = require('child_process').exec;
	exec('echo 1 > /dev/rtled1', (err, stdout, stderr) => {
		// if (err) { console.log(err); }
		// console.log(stdout);
	});
	DispConsole("LED ON");
}

// LED OFF
function OffLed() {
	// shell実行（非同期）
	// http://tkybpp.hatenablog.com/entry/2016/04/25/163246
	const exec = require('child_process').exec;
	exec('echo 0 > /dev/rtled1', (err, stdout, stderr) => {
		// if (err) { console.log(err); }
		// console.log(stdout);
	});
	DispConsole("LED OFF");
}


// ########## 測距センサ ##########
// 光センサの値を読み取って返す
function SendLtValue() {
	var ret = {
		value : {},
	};
	// shell実行（同期）
	// http://tkybpp.hatenablog.com/entry/2016/04/25/163246
	const execSync = require('child_process').execSync;
	const result =  execSync('cat /dev/rtlightsensor0').toString().replace(/\r?\n/g, '');;
	DispConsole(result);

	ret.value.lt = result;
	ret.value.time = GetTimeStruct();
	console.log(ret.value);
	// io.sockets.emit('r2s_LS_DATA', {value : ret.value});
	socket.emit('r2s_LS_DATA', {value : ret.value});
}


// ########## カメラ ##########
function SendCameraCapture() {
	// console.log("Capture! outer");
	node_webcam.capture( "test_picture", opts_camera, function( err, data ) {
		// console.log("Capture! inner");
		DispConsole("Capture!");
		var ret = {
			value : null,
		};
		// var image = "<img src='" + data + "'>";
		// console.log(image);
		// ret.value = 'data:image/jpeg;base64,' + data;
		ret.value = data;
		// DispConsole(typeof(data));
		// DispConsole(data.length);
		socket.emit('r2s_CAMERA_DATA', {value : ret.value});
	});
}


// ########## マイク ##########
function InitMic() {
	// var mic_instance = mic({
	mic_instance = mic({
		// rate: '8000',
		rate: '44100',
		bitwidth: '16',
		encoding: 'signed-integer',
		// encoding: 'unsigned-integer',
		// device: 'plughw:0,0',
		device: 'plughw:1,0',
			// ====================================
			// arecord -l
			// でカード番号とデバイス番号がわかる．
			// arecord -d 3 -D plughw:0,0 out1.wav
			// でカード番号，デバイス番号
			// ====================================
		channels: '1',
		debug: true,
		exitOnSilence: 6
	});
	var mic_input_stream = mic_instance.getAudioStream();
	var output_file_stream = fs.WriteStream('output.raw');
	mic_input_stream.pipe(output_file_stream);
	mic_input_stream.on('data', function(data) {
		// console.log("Recieved Input Stream: " + data.length);
		DispConsole("Recieved Input Stream: " + data.length);
		// console.log(data);
		// console.log(data.toString("hex"));
		// console.log(typeof(data));
		DispConsole(typeof(data));
		socket.emit('r2s_MIC_RAW_DATA', {value : data});
		var len = data.length;
	});
}

function StartMic() {
	mic_instance.start();
}

function StpoMic() {
	mic_instance.stop();
}


// ########## Motor ##########
function PowerOnMotor() {
	const exec = require('child_process').exec;
	exec('echo 1 > /dev/rtmotoren0', (err, stdout, stderr) => { });
}
function PowerOffMotor() {
	const exec = require('child_process').exec;
	exec('echo 0 > /dev/rtmotoren0', (err, stdout, stderr) => { });
}

function SetMotorRaw(left, right) {
	const exec = require('child_process').exec;
	exec('echo ' + String(left)  + ' > /dev/rtmotor_raw_l0', (err, stdout, stderr) => { });
	exec('echo ' + String(right) + ' > /dev/rtmotor_raw_r0', (err, stdout, stderr) => { });
}


// ########## Util ##########
function DispConsole(text, sendFlag = 1) {
	console.log(text);
	if (sendFlag == 1) {
		socket.emit('r2s_ROBOT_CONSOLE_MSG', {value : GetTimeStamp() + ' ' + text});
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

function GetTimeStruct() {
	var now = new Date();
	var time = {};
	time.year    = now.getFullYear();
	time.month   = now.getMonth()+1;
	time.date    = now.getDate();
	time.hours   = now.getHours();
	time.minutes = now.getMinutes();
	time.seconds = now.getSeconds();
	return time;
}

