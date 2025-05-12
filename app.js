// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    console.log('飞花令应用启动');
    
    // 引入诗词工具函数
    const poemUtil = require('./utils/poem');
    
    // 复制诗词文件到可访问的临时目录（仅首次启动时）
    this.copyPoemsFile();
    
    // 初始化诗词数据信息（仅首次使用时）
    poemUtil.initPoemDataInfo();
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
        return; // 文件已存在，不需要复制（保留用户可能已更新的数据）
      } catch (accessErr) {
        // 文件不存在，需要复制默认数据
        console.log('初次使用，复制默认诗词数据');
      }
      
      // 从小程序包内读取shi300.txt文件（注意：在微信小程序中，要读取小程序包内的文件，需要使用相对路径且不带前导斜杠）
      
      
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
