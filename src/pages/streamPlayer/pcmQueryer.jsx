import React, { useContext, useCallback, useEffect, useRef } from 'react';
import PlayerContext, { AudioState } from './playerContext';

function PcmQueryerManual({ url = '/api/getpcm1s' }) {
  const { onBuffer } = useContext(PlayerContext);

  const onGetPcm = useCallback(() => {
    fetch(`${url}`)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        console.log(buf.byteLength, buf);
        onBuffer(buf);
      });
  }, [url, onBuffer]);
  return (
    <>
      <button onClick={onGetPcm}>get1s</button>
    </>
  );
}

export function PcmQueryerSocket({ url = '/topic/video' }) {
  const { onBuffer } = useContext(PlayerContext);

  useEffect(() => {
    // subscriber...   通过onBuffer传递给播放器
    return () => {
      // unsubscriber...
    };
  }, []);

  return null;
}

export function PcmQueryerPoll({ url = '/api/getpcmr8000c2', interval = 10, autoPoll = false }) {
  const timerId = useRef();
  const { onBuffer } = useContext(PlayerContext);

  const onStart = useCallback(() => {
    if (!timerId.current)
      timerId.current = setInterval(() => {
        fetch(`${url}`)
          .then((res) => res.arrayBuffer())
          .then((buf) => {
            // console.log(buf.byteLength);
            onBuffer(buf);
          });
      }, interval);
  }, [interval, onBuffer]);

  const onStop = useCallback(() => {
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoPoll) onStart();
    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, []);

  return (
    <div
      style={{
        // width: '500px',
        border: '1px solid lightblue',
        borderRadius: '10px',
        padding: '10px',
      }}
    >
      <button onClick={onStart}>startQuery</button>
      <button onClick={onStop}>stopQuery</button>
    </div>
  );
}

export default PcmQueryerManual;
