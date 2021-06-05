// ref: https://umijs.org/config/
export default {
  antd: false,
  dva: false,
  dynamicImport: false,
  title: 'wave',
  dll: false,
  workerLoader: {},
  routes: [
    {
      path: '/',
      component: '../layouts/index',
      routes: [
        { path: '/', component: '../pages/index' },
        { path: '/test', component: '../pages/others/streamPlayerTest' },
      ],
    },
  ],
  externals: {
    base64: 'window.Base64',
  },
  scripts: [{ src: '/base64.js' }],
};
