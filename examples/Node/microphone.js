let AipSpeech = require("baidu-aip-sdk").speech;
let fs = require('fs');
const say = require('say');
const record = require('node-record-lpcm16');
const Detector = require('../../lib/node/index.js').Detector;
const Models = require('../../lib/node/index.js').Models;

const models = new Models();
let client = new AipSpeech(0, 'O2rPKQitIcnW87IhvhP64iZk', 'kD4rjkiAz0TFnPWvyLEPGhMjGvVduAkY');
var len = 9000 // 要录用的数据时间长度  s
var voice_stem = new Buffer(0);
var status = 1; // 目前snowboy状态 1:开启 0:关闭 2:正在发布命令状态
var timer = null;
models.add({
  file: 'resources/models/snowboy.umdl',
  sensitivity: 0.5,
  hotwords : 'snowboy'
});

const detector = new Detector({
  resource: "resources/common.res",
  models: models,
  audioGain: 0.5,
  applyFrontend: true
});

// 静音
detector.on('silence', function () {
  // console.log('silence');
});

// 录音回调用的方法
function callback(len, cb) {
  detector.on('sound', function (buffer) {
    // <buffer> contains the last chunk of the audio that triggers the "sound"
    // event. It could be written to a wav stream.
    console.log('正在录音')
    voice_stem = Buffer.concat([buffer, voice_stem], buffer.length + voice_stem.length )
  });
  timer = setTimeout(cb,len)
}

// 语音识别
  function tts(){
    console.log(voice_stem)
    // 识别本地语音文件
    client.recognize(voice_stem, 'wav', 16000).then(function(result) {
      console.log('语音识别本地音频文件结果: ' + JSON.stringify(result));
      // 清空
      // 关闭状态
      voice_stem = new Buffer(0);
      status = 1
      main();
    }, function(err) {
        console.log(err);
    });
  }

//防多次判断 节流处理

// 错误
detector.on('error', function () {
  console.log('error');
});
// 主程序
function main(){
  if (status === 1) {
    // 语音唤醒
    console.log('阿惠同学正在为您服务')
    detector.on('hotword', function (index, hotword, buffer) {
      console.log('hotword', index, hotword,buffer);
      say.speak(`找我做什么`);
      status = 2;
      main();
    });
  } else if (status === 2) {
    console.log('请说您想要做什么')
    // 截取要录取的一段声音
    callback(len,()=>{
      status = 1
      clearTimeout(timer);
      main()
    })
  }
}

main ();
const mic = record.record({
  sampleRate: 16000,
  // threshold:1,
}).stream()

mic.pipe(detector);
