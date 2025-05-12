// index.js
const { searchPoemsByChar } = require('../../utils/poem');

// 最大历史记录数量
const MAX_HISTORY_SIZE = 6;

Page({
  data: {
    searchChar: '', // 用户输入的单个汉字
    searchResults: [], // 搜索结果
    loading: false, // 加载状态
    hasSearched: false, // 是否已进行搜索
    searchHistory: [], // 搜索历史
  },
  
  /**
   * 页面加载时
   */
  onLoad() {
    // 页面初始化逻辑
    console.log("飞花令小程序已加载");
    
    // 加载历史搜索记录
    this.loadSearchHistory();
  },
  
  /**
   * 加载历史搜索记录
   */
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory');
      if (history) {
        this.setData({
          searchHistory: JSON.parse(history)
        });
      }
    } catch (e) {
      console.error('加载历史记录失败：', e);
    }
  },
  
  /**
   * 保存搜索历史
   */
  saveSearchHistory(char) {
    if (!char || char.trim() === '') {
      return;
    }
    
    try {
      let history = this.data.searchHistory || [];
      
      // 删除已存在的相同字符（避免重复）
      history = history.filter(item => item !== char);
      
      // 添加到开头
      history.unshift(char);
      
      // 限制历史记录数量
      if (history.length > MAX_HISTORY_SIZE) {
        history = history.slice(0, MAX_HISTORY_SIZE);
      }
      
      // 保存到本地存储和状态
      wx.setStorageSync('searchHistory', JSON.stringify(history));
      this.setData({
        searchHistory: history
      });
    } catch (e) {
      console.error('保存历史记录失败：', e);
    }
  },
  
  /**
   * 搜索框输入事件处理
   */
  onSearchInput(e) {
    // 获取搜索框的输入内容
    const value = e.detail.value;
    // 只保留一个字符
    this.setData({
      searchChar: value.charAt(value.length - 1)
    });
  },
  
  /**
   * 搜索按钮点击事件处理
   */
  onSearch() {
    const { searchChar } = this.data;
    
    if (!searchChar || searchChar.trim() === '') {
      wx.showToast({
        title: '请输入一个汉字',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载状态
    this.setData({
      loading: true,
      hasSearched: true
    });
    
    // 执行搜索
    try {
      const results = searchPoemsByChar(searchChar);
      
      // 保存到搜索历史
      this.saveSearchHistory(searchChar);
      
      setTimeout(() => {
        this.setData({
          searchResults: results,
          loading: false
        });
        
        // 显示结果统计
        if (results.length > 0) {
          wx.showToast({
            title: `找到${results.length}条结果`,
            icon: 'success'
          });
        }
      }, 500); // 添加短暂延迟，提升用户体验
      
    } catch (error) {
      console.error('搜索诗词出错:', error);
      this.setData({
        loading: false,
        searchResults: []
      });
      wx.showToast({
        title: '搜索出错，请重试',
        icon: 'none'
      });
    }
  },
  
  /**
   * 点击历史搜索标签
   */
  onHistoryTagTap(e) {
    const char = e.currentTarget.dataset.char;
    this.setData({
      searchChar: char
    }, () => {
      this.onSearch();
    });
  },
  
  /**
   * 复制搜索结果
   */
  copyResults() {
    const { searchResults, searchChar } = this.data;
    
    if (searchResults.length === 0) {
      return;
    }
    
    // 格式化要复制的文本
    let copyText = `【飞花令】含"${searchChar}"的诗句：\n\n`;
    
    searchResults.forEach((item, index) => {
      copyText += `${index + 1}. ${item.line}\n   ——${item.author}《${item.title}》\n\n`;
    });
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: copyText,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  }
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
})
