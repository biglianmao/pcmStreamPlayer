import React, { Component, useContext } from 'react';
import PropTypes from 'prop-types';

import PlayerContext, { AudioState, TrunkLength, BlockLength } from './playerContext';
import WaveForm from './waveForm';
import PcmQueryManual, { PcmQueryerPoll, PcmQueryerSocket } from './pcmQueryer';

import Worker from './pcmDecoder.worker.js';

class StreamPlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      audioState: props.autoPlay ? AudioState.PLAY : AudioState.PAUSE,
      bufferStack: [],
      currentPosition: 0,
    };

    this.worker = new Worker();
    this.worker.addEventListener('message', this.onWorkerMessage, false);

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 8000 });
    this.audioCtx.suspend();

    this.scriptNode = this.audioCtx.createScriptProcessor(BlockLength, 2, 2);
    this.scriptNode.onaudioprocess = this.onAudioProcesss;
  }

  onWorkerMessage = (e) => {
    const { channelData, length, duration } = e.data;
    const { bufferStack } = this.state;
    // console.log(channelData, length, duration);
    this.setState({ bufferStack: [...bufferStack, e.data] });
  };

  onAudioProcesss = (e) => {
    const { outputBuffer } = e;
    const { currentPosition, bufferStack } = this.state;
    let count = 0;
    while (count < BlockLength) {
      // currentPosition + count存在否？
      const current = currentPosition + count;
      const currentTrunkIndex = Math.floor(current / TrunkLength);
      // console.log('count:', count);
      // console.log('currentTrunkIndex:', currentTrunkIndex);
      if (!(currentTrunkIndex in bufferStack)) break;

      const currentTrunkOffset = current % TrunkLength;
      const copySize = Math.min(TrunkLength - currentTrunkOffset, BlockLength - count);

      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const copyArray = bufferStack[currentTrunkIndex].channelData[channel].subarray(
          currentTrunkOffset,
          currentTrunkOffset + copySize,
        );
        const outputData = outputBuffer.getChannelData(channel);
        outputData.set(copyArray, count);
      }
      count += copySize;
      // console.log('copySize:', copySize);
      // console.log('count:', count);
    }

    this.setState({ currentPosition: currentPosition + count });

    // 剩下的填噪音
    for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      let outputData = outputBuffer.getChannelData(channel);
      for (let i = count; i < BlockLength; i++) {
        outputData[i] = (Math.random() * 2 - 1) * 0.2;
      }
    }
  };

  componentDidMount() {
    if (this.state.audioState === AudioState.PLAY) {
      this.scriptNode.connect(this.audioCtx.destination);
      this.audioCtx.resume().then(() => {});
    }
  }

  componentDidUpdate(prevProps) {}

  componentWillUnmount() {
    this.cleanup();
  }

  onPlay = () => {
    if (this.state.audioState !== AudioState.PLAY) {
      this.setState({ audioState: AudioState.PLAY, currentPosition: 0 }, () => {
        this.scriptNode.connect(this.audioCtx.destination);
        this.audioCtx.resume().then(() => {});
      });
    }
  };

  onPause = () => {
    if (this.state.audioState !== AudioState.PAUSE) {
      this.audioCtx.suspend().then(() => {
        this.scriptNode.disconnect(this.audioCtx.destination);
        this.setState({ audioState: AudioState.PAUSE });
      });
    }
  };

  onResume = () => {
    if (this.state.audioState === AudioState.PAUSE) {
      this.setState({ audioState: AudioState.PLAY }, () => {
        this.scriptNode.connect(this.audioCtx.destination);
        this.audioCtx.resume().then(() => {});
      });
    }
  };

  onBuffer = (trunk) => {
    this.worker.postMessage({ trunk }, [trunk]);
  };

  onSeek = (position) => {
    this.setState({
      currentPosition: position,
    });
  };

  cleanup = () => {
    if (this.audioCtx) {
      // this.scriptNode.disconnect(this.audioCtx.destination);
      this.audioCtx.close();
      // this.audioCtx = this.createAudioContext();
      this.audioCtx = null;
    }

    if (this.worker) {
      this.worker.removeEventListener('message', this.onWorkerMessage);
      this.worker.terminate();
    }
  };

  handleWorkTest = () => {
    const trunk = new Uint16Array(320);
    for (let i = 0; i < trunk.length; i++) {
      trunk[i] = i;
    }
    this.worker.postMessage({ trunk, index: 0 }, [trunk.buffer]);
  };

  render() {
    const { audioState, bufferStack, currentPosition } = this.state;

    return (
      <div
        style={{
          width: '800px',
          border: '1px solid red',
          borderRadius: '10px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3>pcm stream player use scripnode and webworker</h3>
        <PlayerContext.Provider
          value={{
            audioState,
            bufferStack,
            currentPosition,
            onBuffer: this.onBuffer,
            onPlay: this.onPlay,
            onPause: this.onPause,
            onSeek: this.onSeek,
          }}
        >
          <WaveForm params={this.props.options} />
          <div>
            <span>button:</span>
            <button onClick={this.onPlay}>play/replay</button>
            <button onClick={this.onPause}>pause</button>
            <button onClick={this.onResume}>resume</button>
          </div>
          <PcmQueryerPoll autoPoll={this.props.autoPoll} />
        </PlayerContext.Provider>
      </div>
    );
  }
}

export default StreamPlayer;
