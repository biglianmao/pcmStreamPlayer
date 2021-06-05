import React, { useState, useEffect, useCallback } from 'react';
import Base64 from 'base64';

import { decodeHeader } from '../utils';

function PcmBase64WithoutHeader() {
  const [ctx, setCtx] = useState();
  const [bufs, setBufs] = useState([]);
  const [numberOfChannels, setSumberOfChannels] = useState(1);
  const [sampleRate, setSampleRate] = useState(8000);

  useEffect(() => {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    setCtx(actx);
    return () => {
      actx.close();
      setCtx();
    };
  }, []);

  const onGetPcm = useCallback(
    (url) => () => {
      fetch(`/api/${url}`)
        .then((res) => res.arrayBuffer())
        .then((data) => {
          console.log(bufs.length, data);

          const dataView = new DataView(data);

          const numberOfChannels = dataView.getUint16(22, true);
          const sampleRate = dataView.getUint32(24, true);
          console.log('get=>', numberOfChannels, sampleRate);
          setBufs([...bufs, data]);
        });
    },
    [bufs],
  );
  const onGetPcmBase64 = useCallback(() => {
    // 调用1000次
    const tmp = [];
    const fn = () =>
      fetch('/api/getpcmbase64')
        .then((res) => res.text())
        .then((data) => {
          console.log(data);
          var s = Base64.toUint8Array(data);
          console.log(s);
          // setBufs([...bufs, s]);
          tmp.push(s.buffer);
        });
    const tasks = Array.from({ length: 100 }).fill(fn);
    tasks
      .reduce((cur, next, index) => {
        return cur
          .then(() => {
            console.log(index);
          })
          .then(next);
      }, Promise.resolve())
      .then(function () {
        //all executed
        console.log('end');
        setBufs([...bufs, ...tmp]);
      });
  }, [bufs]);

  const onGet = useCallback(() => onGetPcmBase64(), [onGetPcmBase64]);
  const onPlay = useCallback(() => {
    if (ctx.state == 'suspended') {
      console.log('重启audioCtx');
      ctx.resume();
    }
    // play wave with header
    // for (const buf of bufs) {
    //   ctx
    //     // .decodeAudioData(this.wavHead(buf, this.sampleRate, this.numberOfChannels))
    //     .decodeAudioData(buf)
    //     .then((audioBuf) => {
    //       console.log(`This segment duration: ${audioBuf.duration}`);
    //       const source = ctx.createBufferSource();

    //       source.buffer = audioBuf;
    //       source.connect(ctx.destination);

    //       source.start();
    //     });
    // }

    // const numberOfChannels = 1; // 两个声道
    // const sampleRate = 8000; // 采样率8000
    const totalLength = bufs.reduce((sum, v) => sum + v.byteLength, 0);
    console.log(totalLength);

    const dataBuffer = new ArrayBuffer(totalLength + 44);

    let h = new DataView(dataBuffer, 0, 44);

    h.setUint8(0, 'R'.charCodeAt(0));
    h.setUint8(1, 'I'.charCodeAt(0));
    h.setUint8(2, 'F'.charCodeAt(0));
    h.setUint8(3, 'F'.charCodeAt(0));

    // pcm data len
    h.setUint32(4, totalLength + 36, true);

    h.setUint8(8, 'W'.charCodeAt(0));
    h.setUint8(9, 'A'.charCodeAt(0));
    h.setUint8(10, 'V'.charCodeAt(0));
    h.setUint8(11, 'E'.charCodeAt(0));
    h.setUint8(12, 'f'.charCodeAt(0));
    h.setUint8(13, 'm'.charCodeAt(0));
    h.setUint8(14, 't'.charCodeAt(0));
    h.setUint8(15, ' '.charCodeAt(0));

    h.setUint32(16, 16, true);
    h.setUint16(20, 1, true);
    h.setUint16(22, numberOfChannels, true);
    h.setUint32(24, sampleRate, true);
    h.setUint32(28, sampleRate * numberOfChannels * 2, true);
    h.setUint16(32, numberOfChannels * 2, true);
    h.setUint16(34, 16, true);

    h.setUint8(36, 'd'.charCodeAt(0));
    h.setUint8(37, 'a'.charCodeAt(0));
    h.setUint8(38, 't'.charCodeAt(0));
    h.setUint8(39, 'a'.charCodeAt(0));
    h.setUint32(40, totalLength, true);

    let d = new Uint8Array(dataBuffer, 44);
    let offset = 0;
    for (const buf of bufs) {
      d.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    const d_header = new Uint8Array(dataBuffer, 0, 44);
    console.log(d_header.toString('hex'));
    console.log(new Uint8Array(dataBuffer, 10000, 256));
    decodeHeader(d_header);

    ctx
      // .decodeAudioData(this.wavHead(buf, this.sampleRate, this.numberOfChannels))
      .decodeAudioData(dataBuffer)
      .then((audioBuf) => {
        console.log(`This segment duration: ${audioBuf.duration}`);
        const source = ctx.createBufferSource();

        source.buffer = audioBuf;
        source.connect(ctx.destination);

        source.start();
      })
      .catch((e) => {
        console.log('Error with decoding audio data', e);
      });
  }, [ctx, bufs, numberOfChannels, sampleRate]);
  const onNumberOfChannels = useCallback((e) => {
    setSumberOfChannels(Number(e.target.value));
  }, []);
  const onSampleRate = useCallback((e) => {
    setSampleRate(Number(e.target.value));
  }, []);
  const onPause = useCallback(() => {}, []);
  const onStop = useCallback(() => {}, []);
  return (
    <>
      <div>PcmBase64WithoutHeader</div>
      <div>info:count:{`${bufs.length}`}</div>
      <div>
        parameter: numberOfChannels
        <input type="text" value={numberOfChannels} onChange={onNumberOfChannels} />
        sampleRate
        <select value={sampleRate} onChange={onSampleRate}>
          <option value={8000}>8000</option>
          <option value={16000}>16000</option>
          <option value={44100}>44100</option>
        </select>
      </div>
      <div>
        <button onClick={onGetPcm('getpcm1s')}>Getraw</button>
        <button onClick={onGet}>Get</button>
        <button onClick={onPlay}>Play</button>
        <button onClick={onPause}>Pause</button>
        <button onClick={onStop}>Stop</button>
      </div>
    </>
  );
}

export default PcmBase64WithoutHeader;
