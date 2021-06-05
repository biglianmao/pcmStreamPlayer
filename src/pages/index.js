import React, { useCallback, useEffect, useState } from 'react';
import Base64 from 'base64';
import PcmBase64WithoutHeader from './others/pcmBase64WithoutHeader';
import PcmBase64WithHeader from './others/pcmBase64WithHeader';
import Wave from './others/wavetag';
import WaveObj from './others/waveobj';
import WaveObjFromBuf from './others/waveobjFromBuf';
import StreamPlayer from './streamPlayer';
import { Link } from 'umi';
import styles from './index.css';

export default function () {
  return (
    <div className={styles.normal}>
      <Link to="/test">go</Link>

      <hr style={{ width: '100%' }} />
      <StreamPlayer
        options={
          {
            // rtl: true, // 从右至左
            // realtime: true, // 实时波形，播放位置左侧数据
          }
        }
      />
      {/* <PcmPlayerTest />
      <hr style={{ width: '100%' }} />
      <div>
        <h3>get</h3>
        <button onClick={onGetPcm}>getpcm</button>
        <button onClick={onGetPcmBase64}>onGetPcmBase64</button>
        <button onClick={onPizzicato}>Pizzicato</button>
        <button onClick={onTest}>test</button>
      </div>
      <hr style={{ width: '100%' }} />
      <Wave />
      <WaveObj />
      <WaveObjFromBuf />
      <hr />
      <PcmBase64WithoutHeader />
      <PcmBase64WithHeader />
      <hr style={{ width: '100%' }} />
      <Other /> */}
    </div>
  );
}
