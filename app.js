// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    console.log('飞花令应用启动');
    
    // 复制诗词文件到可访问的临时目录
    this.copyPoemsFile();
  },
  
  // 复制诗词文件到临时目录，以便正确读取
  copyPoemsFile() {
    const fs = wx.getFileSystemManager();
    try {
      // 从小程序包内的data目录复制文件到用户可访问的临时目录
      fs.copyFileSync('data/shi300.txt', `${wx.env.USER_DATA_PATH}/poems_data.txt`);
      console.log('诗词文件已成功复制到临时目录');
    } catch (err) {
      console.error('复制诗词文件失败:', err);
      wx.showToast({
        title: '初始化诗词数据失败',
        icon: 'none',
        duration: 2000
      });
    }
  },
  globalData: {
    poemData: null,  // 诗词数据
    lastSearchChar: '' // 上次搜索的字符
  }
})
