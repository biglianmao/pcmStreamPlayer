import React from 'react';
import { Link } from 'umi';
import StreamPlayer from '../streamPlayer';
import styles from '../index.css';

function Index() {
  return (
    <div className={styles.normal}>
      <Link to="/">go</Link>
      <hr style={{ width: '100%' }} />
      <StreamPlayer
        autoPlay
        autoPoll
        options={{
          rtl: true, // 从右至左
          realtime: true, // 实时波形，播放位置左侧数据
          backgroundColor: '#eee', // 画布底色
          progressColor: '#790', // 已播放颜色
          progressLineColor: '#00f', // 进度条颜色
          waveColor: '#999', // 未播放颜色
          trunkRatio: 1, // 波形和数据块显示比例，一块数据=20ms，160个采样点。比例越大波形滚动越慢
          lineWidth: 1, // 波形线条宽度
          lineGap: 2, // 波形线条间距
          flowSpeed: 1, // 接受缓存后波形向后推进速度，在实时播放模式下无意义
          margin: 10, // 波形垂直方向留白
        }}
      />
      <hr style={{ width: '100%' }} />
    </div>
  );
}

export default Index;
