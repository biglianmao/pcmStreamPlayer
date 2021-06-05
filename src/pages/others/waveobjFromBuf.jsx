import React, { useRef, useCallback, useState, useEffect } from 'react';
import { genWavifyHeader } from '../utils';
import WaveSurfer from 'wavesurfer.js';

function Wavetag() {
  const wave = useRef();
  const wavesurferEl = useRef();
  const [bufs, setBufs] = useState([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const onGetPcmClount = useCallback(
    (url, count) => () => {
      // 调用1000次
      const tmp = [];
      const fn = () =>
        fetch(`/api/${url}`)
          .then((res) => res.arrayBuffer())
          .then((data) => {
            tmp.push(data);
          });
      const tasks = Array.from({ length: count }).fill(fn);
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
    },
    [bufs],
  );

  const onGetPcm = useCallback(
    (url /*, numberOfChannels = 2, sampleRate = 44100, bytesPerSample = 2*/) => () => {
      fetch(`/api/${url}`)
        .then((res) => res.arrayBuffer())
        .then((data) => {
          console.log(data.byteLength);

          // const audioBuf = wavify(data, numberOfChannels, sampleRate, bytesPerSample);
          setBufs([...bufs, data]);
        });
    },
    [bufs],
  );

  const onPlay = useCallback(() => {
    if (wave.current) {
      wave.current.pause();
      wave.current = null;
    }
    const totalLength = bufs.reduce((sum, v) => (sum += v.byteLength), 0);
    const numberOfChannels = 2,
      // sampleRate = 44100,
      sampleRate = 8000,
      bytesPerSample = 2;
    const header = genWavifyHeader(totalLength, numberOfChannels, sampleRate, bytesPerSample);

    const audioBlob = new Blob([header, ...bufs], { type: 'audio/wav' });
    console.log('startplay', bufs.length, totalLength, audioBlob.size);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.addEventListener('timeupdate', (e) => setCurrentTime(e.target.currentTime));
    audio.addEventListener('durationchange', (e) => setDuration(e.target.duration));

    const wavesurfer = WaveSurfer.create({
      container: wavesurferEl.current,
      waveColor: '#A8DBA8',
      progressColor: '#3B8686',
      backend: 'MediaElement',
      height: 65,
      mediaControls: true,
      normalize: true,
      mediaReadyBeforeWavesurferInstantiated: true,
    });

    wavesurfer.load(audio);

    audio.play();
    wave.current = audio;
  }, [bufs]);

  const onPause = useCallback(() => {
    console.log(wave.current?.currentTime, wave.current?.duration);
    wave.current?.pause();
  }, []);
  const onResume = useCallback(() => {
    wave.current?.play();
  }, []);
  return (
    <div
      style={{
        border: '1px solid lightblue',
        borderRadius: '10px',
        margin: '20px',
      }}
    >
      <h3>h5 audio object from buffer</h3>
      <hr />
      <div
        ref={wavesurferEl}
        style={{ width: '600px', height: '300px', border: '1px solid red' }}
      ></div>
      <span>
        info: {bufs.length}||{currentTime}/{duration}
      </span>
      {/* <button onClick={onGetPcm('getpcm1s')}>get</button> */}
      <button onClick={onGetPcmClount('getpcmr8000c2', 1000)}>get</button>
      <button onClick={onPlay}>play</button>
      <button onClick={onPause}>pause</button>
      <button onClick={onResume}>resume</button>
    </div>
  );
}

export default Wavetag;
