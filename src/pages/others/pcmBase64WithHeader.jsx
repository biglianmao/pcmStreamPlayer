import React, { useState, useEffect, useCallback } from 'react';
import Base64 from 'base64';
import { decodeHeader } from '../utils';

function PcmBase64WithHeader() {
  const [ctx, setCtx] = useState();
  const [bufs, setBufs] = useState([]);
  const [source, setSourse] = useState();

  useEffect(() => {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    setCtx(actx);
    return () => {
      actx.close();
      setCtx();
    };
  }, []);

  const onGetPcm = useCallback(() => {
    fetch('/api/getpcm')
      .then((res) => res.arrayBuffer())
      .then((data) => {
        console.log(bufs.length, data);
        decodeHeader(data);

        const dataView = new DataView(data, 0, 44);

        const numberOfChannels = dataView.getUint16(22, true);
        const sampleRate = dataView.getUint32(24, true);
        console.log('get=>', numberOfChannels, sampleRate);
        setBufs([data]);
      });
  }, [bufs]);

  const onGet = useCallback(() => onGetPcm(), [onGetPcm]);
  const onPlay = useCallback(() => {
    if (ctx.state == 'suspended') {
      console.log('重启audioCtx');
      ctx.resume();
    }
    // play wave with header
    for (const buf of bufs) {
      const dst = new ArrayBuffer(buf.byteLength);
      new Uint8Array(dst).set(new Uint8Array(buf));
      ctx
        // .decodeAudioData(this.wavHead(buf, this.sampleRate, this.numberOfChannels))
        .decodeAudioData(dst)
        .then((audioBuf) => {
          console.log(`This segment duration: ${audioBuf.duration}`);
          const source = ctx.createBufferSource();

          source.buffer = audioBuf;
          source.connect(ctx.destination);

          source.start();
          setSourse(source);
        })
        .catch((e) => {
          console.log('Error with decoding audio data', e);
        });
    }
  }, [ctx, bufs]);

  const onPause = useCallback(() => {
    ctx.suspend();
  }, [ctx]);
  const onResume = useCallback(() => {
    ctx.resume();
  }, [ctx]);
  const onClose = useCallback(() => {
    ctx.close();
  }, [ctx]);
  const onStart = useCallback(() => {
    source.start(0);
  }, [source]);
  const onStop = useCallback(() => {
    source.stop(0);
  }, [source]);
  return (
    <>
      <div>PcmBase64WithHeader</div>
      <div>info:count:{`${bufs.length}`}</div>
      <div>
        <button onClick={onGet}>Get</button>
        <button onClick={onPlay}>Play</button>
        <span>--</span>
        <button onClick={onPause}>Pause</button>
        <button onClick={onResume}>resume</button>
        <button onClick={onStop}>Stop</button>
      </div>
    </>
  );
}

export default PcmBase64WithHeader;
