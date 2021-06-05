import React, { useState, useEffect, useRef, useCallback } from 'react';
import PCMPlayer from '../../lib/pcm-player';

function PcmPlayerTest() {
  const player = useRef(
    new PCMPlayer({
      inputCodec: 'Int16',
      channels: 2,
      sampleRate: 8000,
      flushTime: 1000,
    }),
  );

  const [timerId, setTimerId] = useState();

  useEffect(() => {
    player.current?.audioCtx.resume();
    return () => {};
  }, []);

  const onGetPcm = useCallback(
    (url /*, numberOfChannels = 2, sampleRate = 44100, bytesPerSample = 2*/) => () => {
      fetch(`/api/${url}`)
        .then((res) => res.arrayBuffer())
        .then((data) => {
          console.log(data.byteLength);
          player.current?.feed(data);
        });
    },
    [],
  );

  const onStart = useCallback(() => {
    if (!timerId) {
      player.current?.audioCtx.resume();
      const timerId = setInterval(() => {
        onGetPcm('getpcmr8000c2')();
      }, 10);
      setTimerId(timerId);
    } else {
      console.log('player is alread started!');
    }
  }, [timerId, onGetPcm]);

  const onStop = useCallback(() => {
    clearInterval(timerId);
    player.current?.pause();
    setTimerId(undefined);
  }, [timerId]);

  return (
    <div
      style={{
        width: '500px',
        border: '1px solid lightblue',
        borderRadius: '10px',
        margin: '20px',
      }}
    >
      <h3>pcmPlayer test</h3>
      <hr />
      <span></span>
      <button onClick={onStart}>play</button>
      <button onClick={onStop}>pause</button>
      <button onClick={onStart}>resume</button>
    </div>
  );
}

export default PcmPlayerTest;
