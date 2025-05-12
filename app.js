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
    const targetPath = `${wx.env.USER_DATA_PATH}/poems_data.txt`;
    
    try {
      // 检查目标文件是否已存在
      try {
        fs.accessSync(targetPath);
        console.log('诗词文件已存在，无需复制');
        return; // 文件已存在，不需要复制
      } catch (accessErr) {
        // 文件不存在，需要复制
      }
      
      // 从小程序包内的data目录复制文件到用户可访问的临时目录
      fs.copyFileSync('data/shi300.txt', targetPath);
      console.log('诗词文件已成功复制到临时目录');
      
      // 初次安装时，设置默认的数据版本和来源
      const now = new Date();
      const version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const source = '唐诗三百首(初始数据)';
      
      try {
        wx.setStorageSync('poemDataVersion', version);
        wx.setStorageSync('poemDataSource', source);
      } catch (storageErr) {
        console.error('保存数据信息失败:', storageErr);
      }
      
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
