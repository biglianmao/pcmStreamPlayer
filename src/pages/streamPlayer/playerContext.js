import React from 'react';

export const TrunkLength = 160; // 每块pcm样本数，典型8000采样率20ms一包pcm包含160个样本
export const BlockLength = 512;
export const AudioState = {
  PLAY: 'play',
  PAUSE: 'pause',
  BUFFERING: 'buffering',
};

const PlayerContext = React.createContext({});

export default PlayerContext;
