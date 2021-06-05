import React, { useRef, useCallback, useState, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

function Wavetag() {
  const wave = useRef();
  const wavesurferEl = useRef();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
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

    wavesurfer.load(wave.current);
    return () => {};
  }, []);

  const onCurrentTime = useCallback((e) => {
    // console.log(e.target.currentTime);
    setCurrentTime(e.target.currentTime);
  }, []);
  const onDuration = useCallback((e) => {
    // console.log(e.target.duration);
    setDuration(e.target.duration);
  }, []);
  const onPlay = useCallback(() => {
    wave.current.play();
  }, []);
  const onPause = useCallback(() => {
    console.log(wave.current?.currentTime, wave.current?.duration);
    wave.current.pause();
  }, []);
  const onResume = useCallback(() => {
    wave.current.play();
  }, []);
  return (
    <div
      style={{
        // width: '500px',
        border: '1px solid lightblue',
        borderRadius: '10px',
        margin: '20px',
      }}
    >
      <h3>h5 audio tag</h3>
      <div
        ref={wavesurferEl}
        style={{ width: '600px', height: '300px', border: '1px solid red' }}
      ></div>
      <audio
        ref={wave}
        src="/api/getpcmfile"
        controls
        onTimeUpdate={onCurrentTime}
        onDurationChange={onDuration}
      >
        wavepcm
      </audio>
      <hr />
      <span>
        info: {currentTime}/{duration}
      </span>
      <button onClick={onPlay}>play</button>
      <button onClick={onPause}>pause</button>
      <button onClick={onResume}>resume</button>
    </div>
  );
}

export default Wavetag;
