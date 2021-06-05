import React, { useCallback, useContext, useEffect, useRef } from 'react';
import PlayerContext, { AudioState } from './playerContext';

import drawer from './drawer';

function WaveForm(props) {
  const { option, params } = props;
  const waveFormRef = useRef();
  const drawerRef = useRef();

  const { audioState, bufferStack, currentPosition } = useContext(PlayerContext);

  useEffect(() => {
    drawerRef.current = new drawer(waveFormRef.current, params);
    return () => {
      drawerRef.current.destroy();
      drawerRef.current = null;
    };
  }, []);
  useEffect(() => {
    drawerRef.current?.feed(bufferStack, currentPosition, audioState);
  }, [bufferStack, currentPosition, audioState]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <div ref={waveFormRef} style={{ height: '100px' }}></div>
      <span>state:{audioState}</span>
      <span>
        bufferCount:{Math.floor(currentPosition / 160)}/{bufferStack.length}
      </span>
      <span>
        time:{~~(currentPosition / 160) * 20}ms/{bufferStack.length * 20}ms
      </span>
    </div>
  );
}

export default WaveForm;
