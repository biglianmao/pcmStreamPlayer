const fs = require('fs');
const path = require('path');

const pcm = fs.readFileSync(path.resolve('./mock/1.pcm'));
const pcm_1s = fs.readFileSync(path.resolve('./mock/1s.raw'));
const pcm_1full = fs.readFileSync(path.resolve('./mock/1full.raw'));
const pcm2 = fs.readFileSync(path.resolve('./mock/16bit-8000.raw'));
const pcmBase64 = fs.readFileSync(path.resolve('./mock/base64.txt'));
const pcm_r8000_c2_withheader = fs.readFileSync(path.resolve('./mock/pcm/1.8000.wav'));

const pcm_r8000_c2_withoutheader = Uint8Array.prototype.slice.call(
  pcm_r8000_c2_withheader,
  44,
  pcm_r8000_c2_withheader.byteLength - ((pcm_r8000_c2_withheader.byteLength - 44) % 640),
);

// const pcm =
//   '/v8CAP3/AgABAAEAAwD9//7//v///wEAAgD//wQAAQABAAAA/P//////AwACAAAAAAD///7/AAACAAEAAAABAP3/AAD///3/AgD+/wIAAgD//wMAAAD+/wAAAAACAAQAAQACAP3//v8BAAEAAgAAAPz//f/+//7/AgD9////AAD8/wIA/P8AAAAAAAAFAAEAAgD+////AAAAAAAAAgACAAEAAQAAAAMAAgACAP7/AQAAAAEAAAD9/wAAAAABAP//AQABAP3////8//7/AAAAAP7///8BAAAAAgD9/////v8AAAAA//8BAP//AwD//wEAAQABAAIAAgAAAAQAAAADAAIA//8CAP//AwD//wEA/v8AAAAA/f/9//r//P/9//7//v8AAAAAAAAAAAAAAgADAAQAAwAEAAIABAADAAEAAQD//wEAAAABAAAAAAD+//z//f/9//3////9//7/AQD//wMA////////AAACAP//BAD//wMAAgD+/wIA/f////7///8CAAMAAwD+/////v/+/wIA/v8DAAAA//8BAP//AwD//wIA/v8AAP///v8AAP7/AQD+/wEAAAD8/wIA/v8CAAIAAQACAAAAAAD//wEAAQACAP7/AAD9//7//v////7//f8BAAEABAAAAP7////+/wMABAADAAIAAgAAAAMAAwD+/wIA+//+//7//f8CAPz//v8AAP3/AwD+////AAD9/wIA//8DAAMAAAAAAP3/AAD9/wIAAgACAAQAAAADAAEAAAD//wAAAAAAAP//AgD+/wAAAwAAAAMA/P/+/wAAAAACAP3//P/+//7/AAAAAP7//v////3//v///wAA//8BAA==';

function getPcm(req, res) {
  // const pcmBase64 = fs.readFileSync(path.resolve('./base64.txt'));
  res.send(pcm);
  // return fs.readFile(path.resolve('./mock/base64.txt'), (err, data) => {
  //   if (err) throw err;
  //   console.log(data);
  //   res.send(data);
  // });
}
function getPcm1s(req, res) {
  res.send(pcm_1s);
}
function getPcmfull(req, res) {
  res.send(pcm_1full);
}
function getPcm2(req, res) {
  res.send(pcm2);
}
function getPcmBase64(req, res) {
  res.send(pcmBase64);
}

function getPcmFile(req, res) {
  const fileName = path.resolve('./mock/1.pcm');
  const options = {
    headers: {
      'Content-Type': 'audio/wave',
      'Cache-Control': 'no-store',
    },
  };
  res.sendFile(fileName, options, function (err) {
    if (err) {
    } else {
      console.log('send:', fileName);
    }
  });
}

let index = 0;
function getPcmR8000C2(req, res) {
  const buf = Buffer.from(pcm_r8000_c2_withoutheader.buffer, index * 640, 640);
  index = (index + 1) % (pcm_r8000_c2_withoutheader.byteLength / 640);
  res.send(buf);
}

export default {
  'GET /api/getpcm': getPcm,
  'GET /api/getpcm1s': getPcm1s,
  'GET /api/getpcmfull': getPcmfull,
  'GET /api/getpcm2': getPcm2,
  'GET /api/getpcmbase64': getPcmBase64,
  'GET /api/getpcmfile': getPcmFile,
  'GET /api/getpcmr8000c2': getPcmR8000C2,
};
