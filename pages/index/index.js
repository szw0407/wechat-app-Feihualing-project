// index.js
const { 
  searchPoemsByChar, 
  updatePoemDataFromUrl, 
  importPoemDataFromFile, 
  getPoemDataInfo,
  initPoemDataInfo,
  DEFAULT_POEM_DATA_URL
} = require('../../utils/poem');
const { default: defaultPoemData } = require('../../utils/data_default');
// 最大历史记录数量
const MAX_HISTORY_SIZE = 6;

Page({
  data: {
    searchChar: '', // 用户输入的单个汉字
    searchResults: [], // 搜索结果
    loading: false, // 加载状态
    hasSearched: false, // 是否已进行搜索
    searchHistory: [], // 搜索历史
    showUpdateModal: false, // 是否显示数据更新弹窗
    updateUrl: '', // 自定义更新URL
    dataVersion: '', // 数据版本
    dataSource: '', // 数据来源
    lastSearchedChar: '', // 最后一次搜索的字符
  },
  
  /**
   * 页面加载时
   */
  onLoad() {
    // 页面初始化逻辑
    console.log("飞花令小程序已加载");
    
    // 加载历史搜索记录
    this.loadSearchHistory();
    
    // 加载数据版本信息
    this.loadDataInfo();
  },
  
  /**
   * 加载数据版本信息
   */
  loadDataInfo() {
    const { version, source } = getPoemDataInfo();
    this.setData({
      dataVersion: version,
      dataSource: source
    });
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
    // 允许输入多个字符
    this.setData({
      searchChar: value
    });
  },
  
  /**
   * 搜索按钮点击事件处理
   */
  onSearch() {
    const { searchChar } = this.data;
    
    if (!searchChar || searchChar.trim() === '' || searchChar.trim().length > 1) {
      wx.showToast({
        title: '请输入一个汉字',
        icon: 'none'
      });
      return;
    }
    
    // 提取第一个汉字进行查询
    const firstChar = searchChar.trim().charAt(0);
    
    // 校验是否是汉字
    if (!/[\u4e00-\u9fa5]/.test(firstChar)) {
      wx.showToast({
        title: '请输入汉字',
        icon: 'none'
      });
      return;
    }
    
    // 更新搜索字符为提取的第一个汉字
    this.setData({
      searchChar: firstChar
    });
    
    // 显示加载状态
    this.setData({
      loading: true,
      hasSearched: true
    });
    
    // 执行搜索
    try {
      const results = searchPoemsByChar(firstChar);
      
      // 保存到搜索历史
      this.saveSearchHistory(firstChar);
      
      setTimeout(() => {
        this.setData({
          searchResults: results,
          loading: false,
          lastSearchedChar: firstChar // 记录最后一次搜索的字符
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
    const { searchResults, lastSearchedChar } = this.data;
    
    if (searchResults.length === 0) {
      return;
    }
    
    // 格式化要复制的文本
    let copyText = `【飞花令】含"${lastSearchedChar}"的诗句：\n\n`;
    
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
  },
  
  /**
   * 点击历史搜索标签
   */
  /**
   * 清空搜索结果和搜索框
   */
  clearSearch() {
    this.setData({
      searchChar: '',
      searchResults: [],
      hasSearched: false,
      lastSearchedChar: ''
    });
    
    wx.showToast({
      title: '已清空',
      icon: 'success',
      duration: 1000
    });
  },
  
  /**
   * 删除单个历史记录
   */
  deleteHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const history = this.data.searchHistory.slice();
    
    // 删除指定索引的历史记录
    history.splice(index, 1);
    
    // 保存到本地存储和状态
    wx.setStorageSync('searchHistory', JSON.stringify(history));
    this.setData({
      searchHistory: history
    });
  },
  
  /**
   * 清空全部历史记录
   */
  clearAllHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空全部搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空历史记录
          wx.setStorageSync('searchHistory', JSON.stringify([]));
          this.setData({
            searchHistory: []
          });
          
          wx.showToast({
            title: '历史已清空',
            icon: 'success',
            duration: 1000
          });
        }
      }
    });
  },
  
  /**
   * 显示数据更新选项弹窗
   */
  showDataUpdateOptions() {
    this.setData({
      showUpdateModal: true,
      updateUrl: ''
    });
  },
  
  /**
   * 隐藏弹窗
   */
  hideModal() {
    this.setData({
      showUpdateModal: false
    });
  },
  
  /**
   * 自定义URL输入处理
   */
  onUrlInput(e) {
    this.setData({
      updateUrl: e.detail.value
    });
  },
  
  /**
   * 从默认URL更新数据
   */
  updateFromDefaultUrl() {
    wx.showModal({
      title: '数据更新确认',
      content: '确定从默认数据源更新诗词库吗？',
      success: (res) => {
        if (res.confirm) {
          updatePoemDataFromUrl()
            .then(result => {
              // 隐藏弹窗
              this.setData({
                showUpdateModal: false
              });
              
              // 更新数据版本信息
              this.setData({
                dataVersion: result.version,
                dataSource: result.source,
                searchResults: [], // 清空当前搜索结果
                hasSearched: false // 重置搜索状态
              });
              
              wx.showModal({
                title: '数据更新成功',
                content: '已从默认数据源更新诗词库',
                showCancel: false
              });
            })
            .catch(error => {
              wx.showModal({
                title: '数据更新失败',
                content: error.error || '请检查网络连接',
                showCancel: false
              });
            });
        }
      }
    });
  },
  
  /**
   * 从自定义URL更新数据
   */
  updateFromCustomUrl() {
    const { updateUrl } = this.data;
    
    if (!updateUrl || updateUrl.trim() === '') {
      wx.showToast({
        title: '请输入有效的URL',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '数据更新确认',
      content: '确定从自定义URL更新诗词库吗？',
      success: (res) => {
        if (res.confirm) {
          updatePoemDataFromUrl(updateUrl)
            .then(result => {
              // 隐藏弹窗
              this.setData({
                showUpdateModal: false
              });
              
              // 更新数据版本信息
              this.setData({
                dataVersion: result.version,
                dataSource: result.source,
                searchResults: [], // 清空当前搜索结果
                hasSearched: false // 重置搜索状态
              });
              
              wx.showModal({
                title: '数据更新成功',
                content: '已从自定义URL更新诗词库',
                showCancel: false
              });
            })
            .catch(error => {
              wx.showModal({
                title: '数据更新失败',
                content: error.error || '请检查URL或网络连接',
                showCancel: false
              });
            });
        }
      }
    });
  },
  
  /**
   * 选择本地文件导入
   */
  chooseLocalFile() {
    // 选择文件
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path;
        const fileName = res.tempFiles[0].name;
        
        wx.showModal({
          title: '导入确认',
          content: `确定导入文件"${fileName}"作为诗词库吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              importPoemDataFromFile(tempFilePath)
                .then(result => {
                  // 隐藏弹窗
                  this.setData({
                    showUpdateModal: false
                  });
                  
                  // 更新数据版本信息
                  this.setData({
                    dataVersion: result.version,
                    dataSource: result.source,
                    searchResults: [], // 清空当前搜索结果
                    hasSearched: false // 重置搜索状态
                  });
                  
                  wx.showModal({
                    title: '导入成功',
                    content: `已成功导入文件"${fileName}"作为诗词库`,
                    showCancel: false
                  });
                })
                .catch(error => {
                  wx.showModal({
                    title: '导入失败',
                    content: error.error || '文件格式可能不正确',
                    showCancel: false
                  });
                });
            }
          }
        });
      },
      fail: (res) => {
        console.error('选择文件失败:', res);
      }
    });
  },

  /**
   * 重置数据到初始状态（空）
   */
  resetToDefault() {
    wx.showModal({
      title: '重置数据确认',
      content: '确定要重置数据到初始状态吗？',
      success: (res) => {
        if (res.confirm) {
          // 删除本地存储的诗词数据
          const fs = wx.getFileSystemManager();
          const targetPath = `${wx.env.USER_DATA_PATH}/poems_data.txt`;
          // 写入默认数据
          fs.writeFileSync(targetPath, defaultPoemData, "utf-8");
          
          // 初始化数据
          initPoemDataInfo();
          
          wx.showToast({
            title: '数据已重置',
            icon: 'success',
            duration: 1000
          });
        }
      }
    });
    // force reload the app totally
    // wx.reLaunch({
    //   url : '/pages/index/index',
    //   success: () => {
    //     console.log('App reloaded');
    //   },
    //   fail: (error) => {
    //     console.error('Failed to reload app:', error);
    //   }
    // });
  }
});
