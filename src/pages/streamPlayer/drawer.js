import * as util from './lib';
import { AudioState, TrunkLength } from './playerContext';
/**
 * Parent class for renderers
 *
 * @extends {Observer}
 */
export default class Drawer extends util.Observer {
  defaultParams = {
    rtl: false, // 从右至左
    realtime: false, // 实时波形，播放位置左侧数据
    backgroundColor: '#eee', // 画布底色
    progressColor: '#790', // 已播放颜色
    progressLineColor: '#00f', // 进度条颜色
    waveColor: '#999', // 未播放颜色
    trunkRatio: 1, // 波形和数据块显示比例，一块数据=20ms，160个采样点。比例越大波形滚动越慢
    lineWidth: 1, // 波形线条宽度
    lineGap: 2, // 波形线条间距
    flowSpeed: 1, // 接受缓存后波形向后推进速度，在实时播放模式下无意义
    margin: 10, // 波形垂直方向留白
  };
  constructor(container, params) {
    super();

    this.params = Object.assign({}, this.defaultParams, params);

    this.container = container;
    this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;

    this.wrapper = null;
    this.warpperWidth = this.container.clientWidth;
    this.warpperHeight = this.container.clientHeight;

    this.waveCanvas = null;
    this.waveCanvasWidth = this.warpperWidth * this.pixelRatio;
    this.waveCanvasHeight = this.warpperHeight * this.pixelRatio;
    this.waveCanvasCtx = null;

    this.channelWaveHight = this.waveCanvasHeight - this.params.margin * 2; //缺省占满整个高度

    // 状态
    this.offset = 0;
    this.playPosition = 0;
    this.audioState = AudioState.PAUSE;
    // 整个画布容纳的波形数量
    this.maxDrawCount = ~~(this.waveCanvasWidth / (this.params.lineWidth + this.params.lineGap));
    this.preDrawInfo = [0, 0, 0];

    // cancel函数
    this.cancel = null;

    this.createWrapper();
  }

  createWrapper() {
    // 创建wrapper
    this.wrapper = document.createElement('div');
    this.container.appendChild(this.wrapper);

    this.style(this.wrapper, {
      display: 'block',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      width: this.warpperWidth + 'px',
      height: this.warpperHeight + 'px',
      overflow: 'hidden',
    });
    if (this.params.rtl === true) {
      util.style(this.wrapper, { transform: 'rotateY(180deg)' });
    }

    // 创建波形画布
    this.waveCanvas = document.createElement('canvas');
    this.waveCanvas.width = this.waveCanvasWidth;
    this.waveCanvas.height = this.waveCanvasHeight;
    this.wrapper.appendChild(this.waveCanvas);
    this.waveCanvasCtx = this.waveCanvas.getContext('2d');
    this.waveCanvasCtx.strokeStyle = this.params.waveColor;
    this.waveCanvasCtx.lineWidth = 1;
    this.waveCanvasCtx.fillStyle = this.params.backgroundColor;
    this.waveCanvasCtx.fillRect(0, 0, this.waveCanvasWidth, this.waveCanvasHeight);

    this.style(this.waveCanvas, {
      position: 'absolute',
      zIndex: 2,
      left: 0,
      //   width: this.waveCanvasWidth + 'px',
      width: '100%',
      top: 0,
      height: '100%',
      pointerEvents: 'none',
    });

    this.setupWrapperEvents();
  }

  updateCanvasWidth(trunkCount) {
    this.waveCanvasWidth = Math.max(this.waveCanvasWidth, ~~(trunkCount / this.params.trunkRatio));

    this.style(this.waveCanvas, {
      width: this.waveCanvasWidth + 'px',
    });
  }

  prepareDraw(bufferStack, currentPosition, audioState) {
    this.playPosition = ~~(currentPosition / TrunkLength / this.params.trunkRatio);
    // console.log(currentPosition, this.playPosition, this.offset, this.preDrawInfo);

    const totalDrawCount = ~~(bufferStack.length / this.params.trunkRatio);

    const thisDrawCount = Math.min(totalDrawCount - this.offset, this.maxDrawCount);

    if (totalDrawCount - thisDrawCount - this.offset > this.params.flowSpeed) {
      this.offset = totalDrawCount - thisDrawCount;
    }

    const playPositionChanged =
      this.playPosition >= this.offset &&
      this.playPosition < this.offset + thisDrawCount &&
      this.playPosition !== this.preDrawInfo[2];

    const rangeNotChange =
      this.offset === this.preDrawInfo[0] && thisDrawCount === this.preDrawInfo[1];
    return !rangeNotChange || playPositionChanged;
  }

  prepareDrawWithCurrentPos(bufferStack, currentPosition, audioState) {
    this.offset = this.playPosition = ~~(currentPosition / TrunkLength / this.params.trunkRatio);

    const playPositionChanged = this.playPosition !== this.preDrawInfo[2];

    return playPositionChanged;
  }

  drawLine(ctx, i, bufferStack, startX, startY, channel = 0) {
    const drawIndex = (i + this.offset) * this.params.trunkRatio;
    // 只取了上峰值画出来，如有必要再取下峰值
    const dh = Array.from({ length: this.params.trunkRatio }).map(
      (_, index) => bufferStack[drawIndex + index].channelPeaks[channel][1],
    );
    // const dl = Array.from({ length: this.params.trunkRatio }).map(
    //   (_, index) => bufferStack[drawIndex + index].channelPeaks[channel][0],
    // );

    const dhMax = Math.max.apply(null, dh);
    // const dlMin = Math.min.apply(null, dl);
    const Y1 = startY + this.channelWaveHight / 2 - (dhMax * this.channelWaveHight) / 2;
    //   const Y2 = startY + this.channelWaveHight / 2 - (dlMin * this.channelWaveHight) / 2;
    const Y2 = startY + this.channelWaveHight / 2 + (dhMax * this.channelWaveHight) / 2;
    const X = startX + i * (this.params.lineWidth + this.params.lineGap);
    ctx.moveTo(X, Y1);
    ctx.lineTo(X, Y2);
  }

  drawChannelWaveForm(
    ctx,
    bufferStack,
    /*, refresh = false*/ startX = 0,
    startY = this.params.margin,
    channel = 0,
  ) {
    // if (refresh) {
    //   //   ctx.clearRect(startX, startY, this.waveCanvasWidth, this.channelWaveHight);
    //   ctx.fillRect(startX, startY, this.waveCanvasWidth, this.channelWaveHight);
    // }
    const totalDrawCount = ~~(bufferStack.length / this.params.trunkRatio);
    const thisDrawCount = Math.min(totalDrawCount - this.offset, this.maxDrawCount);
    const playPosition = this.playPosition - this.offset;
    this.preDrawInfo = [this.offset, thisDrawCount, this.playPosition];
    ctx.clearRect(startX, startY, this.waveCanvasWidth, this.channelWaveHight);
    ctx.fillRect(startX, startY, this.waveCanvasWidth, this.channelWaveHight);
    ctx.beginPath();
    this.waveCanvasCtx.strokeStyle = this.params.progressColor;
    for (let i = 0; i < Math.min(playPosition, thisDrawCount); i++) {
      this.drawLine(ctx, i, bufferStack, startX, startY, channel);
    }
    ctx.stroke();
    if (playPosition > 0) {
      ctx.beginPath();
      this.waveCanvasCtx.strokeStyle = this.params.progressLineColor;
      const Y1 = startY;
      //   const Y2 = startY + this.channelWaveHight / 2 - (dlMin * this.channelWaveHight) / 2;
      const Y2 = startY + this.channelWaveHight;
      const X =
        startX +
        playPosition * (this.params.lineWidth + this.params.lineGap) +
        this.params.lineWidth;
      ctx.moveTo(X, Y1);
      ctx.lineTo(X, Y2);
      ctx.stroke();
    }
    ctx.beginPath();
    this.waveCanvasCtx.strokeStyle = this.params.waveColor;
    for (let i = Math.max(playPosition, 0); i < thisDrawCount; i++) {
      this.drawLine(ctx, i, bufferStack, startX, startY, channel);
    }
    ctx.stroke();
  }

  drawChannelWaveFormCurrentPos(
    ctx,
    bufferStack,
    /*, refresh = false*/ startX = 0,
    startY = this.params.margin,
    channel = 0,
  ) {
    const playPosition = this.playPosition - 1; // 此块可能接收不全，暂时不画了
    const thisDrawCount = Math.min(playPosition, this.maxDrawCount);
    this.preDrawInfo = [this.offset, thisDrawCount, this.playPosition];
    ctx.clearRect(startX, startY, this.waveCanvasWidth, this.channelWaveHight);
    ctx.fillRect(startX, startY, this.waveCanvasWidth, this.channelWaveHight);
    ctx.beginPath();
    this.waveCanvasCtx.strokeStyle = this.params.progressColor;
    for (let i = 0; i < thisDrawCount; i++) {
      const drawIndex = (playPosition - i) * this.params.trunkRatio;
      // 只取了上峰值画出来，如有必要再取下峰值
      const dh = Array.from({ length: this.params.trunkRatio }).map(
        (_, index) => bufferStack[drawIndex + index].channelPeaks[channel][1],
      );
      // const dl = Array.from({ length: this.params.trunkRatio }).map(
      //   (_, index) => bufferStack[drawIndex + index].channelPeaks[channel][0],
      // );

      const dhMax = Math.max.apply(null, dh);
      // const dlMin = Math.min.apply(null, dl);
      const Y1 = startY + this.channelWaveHight / 2 - (dhMax * this.channelWaveHight) / 2;
      //   const Y2 = startY + this.channelWaveHight / 2 - (dlMin * this.channelWaveHight) / 2;
      const Y2 = startY + this.channelWaveHight / 2 + (dhMax * this.channelWaveHight) / 2;
      const X = startX + i * (this.params.lineWidth + this.params.lineGap);
      ctx.moveTo(X, Y1);
      ctx.lineTo(X, Y2);
    }
    ctx.stroke();
  }

  feedDrawPoll(bufferStack, currentPosition, audioState) {
    this.audioState = audioState;
    const needDraw = this.prepareDraw(bufferStack, currentPosition, audioState);
    if (needDraw) {
      // console.log('need draw');
      this.cancel = util.frame(() => this.drawChannelWaveForm(this.waveCanvasCtx, bufferStack))();
    } else {
      // console.log('not need draw');
    }
  }

  feedDrawRealtime(bufferStack, currentPosition, audioState) {
    const needDraw = this.prepareDrawWithCurrentPos(bufferStack, currentPosition, audioState);
    if (needDraw) {
      // console.log('need draw');
      this.cancel = util.frame(() =>
        this.drawChannelWaveFormCurrentPos(this.waveCanvasCtx, bufferStack),
      )();
    } else {
      // console.log('not need draw');
    }
  }

  feed() {
    if (this.params.realtime) this.feedDrawRealtime.apply(this, arguments);
    else this.feedDrawPoll.apply(this, arguments);
  }

  setupWrapperEvents() {
    this.wrapper.addEventListener('click', (e) => {
      if (this.params.interact) {
        this.fireEvent('click', e, this.handleEvent(e));
      }
    });

    this.wrapper.addEventListener('dblclick', (e) => {
      if (this.params.interact) {
        this.fireEvent('dblclick', e, this.handleEvent(e));
      }
    });
  }

  handleEvent(e, noPrevent) {
    !noPrevent && e.preventDefault();

    const clientX = e.clientX;
    const bbox = this.wrapper.getBoundingClientRect();
  }

  destroy() {
    this.unAll();
    if (this.wrapper) {
      this.wrapper.removeChild(this.waveCanvas);
      this.waveCanvas = null;
      this.waveCanvasCtx = null;
      this.container.removeChild(this.wrapper);
      this.wrapper = null;
    }
    if (this.cancel) {
      // console.log('cancel');
      this.cancel && this.cancel();
    }
  }

  style(el, styles) {
    return util.style(el, styles);
  }
}
