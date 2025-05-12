// utils/poem.js
const fs = wx.getFileSystemManager();

// 默认的诗词数据URL
const DEFAULT_POEM_DATA_URL = 'https://szw0407.github.io/wechat-app-feihualing-project/shi300.txt';

// 本地诗词数据文件路径
const LOCAL_POEM_DATA_PATH = `${wx.env.USER_DATA_PATH}/poems_data.txt`;

// 数据版本信息存储键
const DATA_VERSION_KEY = 'poemDataVersion';
const DATA_SOURCE_KEY = 'poemDataSource';

/**
 * 初始化诗词数据信息
 * 仅在首次使用时设置默认值，不会覆盖用户已更新的数据
 */
function initPoemDataInfo() {
  try {
    const existingSource = wx.getStorageSync(DATA_SOURCE_KEY);
    
    // 只有在没有来源记录的情况下才设置默认值
    if (!existingSource) {
      wx.setStorageSync(DATA_SOURCE_KEY, '唐诗三百首（默认）');
      console.log('已初始化默认数据来源信息');
    }
  } catch (e) {
    console.error('初始化数据信息失败:', e);
  }
}

/**
 * 解析诗词内容，返回格式化的诗词数据
 * @returns {Array} 解析后的诗词数组，每项包含{title, author, content, source}
 */
function parsePoems() {
  try {
    // 读取诗词文件
    const content = fs.readFileSync(LOCAL_POEM_DATA_PATH, 'utf-8');
    const lines = content.split('\n');
    
    const poems = [];
    let currentPoem = null;
    let isInPoemContent = false; // 标记是否在诗句内容区域
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行和非诗句内容
      if (!line || line.startsWith('标点') || line.startsWith('此电子版') || 
          line.startsWith('卷') && line.includes('...') || 
          line.includes('目录') || line === '唐诗三百首') {
        continue;
      }
        // 检测诗词编号和标题行 (如 "001张九龄：感遇四首之一")
      // 增强匹配规则，兼容更多格式
      const poemHeaderMatch = line.match(/^(\d{3})(.+?)：(.+)$/) || line.match(/^(\d+)[\.、]?\s*(.+?)[：|:]\s*(.+)$/);
      if (poemHeaderMatch) {
        // 保存上一首诗
        if (currentPoem && currentPoem.content.length > 0) {
          // 清理空行
          currentPoem.content = currentPoem.content.filter(l => l.trim() !== '');
          poems.push(currentPoem);
        }
        
        // 开始新的一首诗
        currentPoem = {
          id: poemHeaderMatch[1],
          author: poemHeaderMatch[2],
          title: poemHeaderMatch[3],
          content: [],
          source: `${poemHeaderMatch[2]}《${poemHeaderMatch[3]}》` // 完整的出处信息
        };
        isInPoemContent = true; // 现在开始是诗句内容
        continue;
      }
      
      // 如果遇到下一个编号（但不符合标准格式），可能是新诗的开始
      if (line.match(/^\d{3}/) && !poemHeaderMatch) {
        isInPoemContent = false;
        continue;
      }
      
      // 如果已经有当前诗，则添加内容行
      if (currentPoem && isInPoemContent) {
        // 跳过非诗句内容(如页码等)
        if (line.match(/^\d+$/) || line.startsWith('唐诗') || 
            line.includes('....') || line.includes('----')) {
          continue;
        }
        
        // 跳过不像诗句的行（例如页码标记、编注等）
        if (line.length < 2) {
          continue;
        }
        
        currentPoem.content.push(line);
      }
    }
    
    // 添加最后一首诗
    if (currentPoem && currentPoem.content.length > 0) {
      // 清理空行
      currentPoem.content = currentPoem.content.filter(l => l.trim() !== '');
      poems.push(currentPoem);
    }
    
    return poems;
  } catch (error) {
    console.error('解析诗词文件失败:', error);
    return [];
  }
}

/**
 * 根据关键字搜索诗句
 * @param {string} keyword 搜索关键字，单个汉字
 * @returns {Array} 匹配的诗句数组，每项包含{line, author, title, source, charIndices}
 */
function searchPoemsByChar(keyword) {
  if (!keyword || keyword.length !== 1) {
    return [];
  }
  
  const poems = parsePoems();
  const results = [];
  
  poems.forEach(poem => {
    poem.content.forEach(line => {
      if (line.includes(keyword)) {
        // 找出关键字在诗句中所有出现的位置
        const charIndices = [];
        let pos = line.indexOf(keyword);
        while (pos !== -1) {
          charIndices.push(pos);
          pos = line.indexOf(keyword, pos + 1);
        }
        
        results.push({
          line: line,
          author: poem.author,
          title: poem.title,
          source: poem.source,
          charIndices: charIndices // 添加字符匹配的所有位置信息
        });
      }
    });
  });
    return results;
}

/**
 * 从URL下载诗词数据并保存到本地
 * @param {string} url 数据URL，如果为空则使用默认URL
 * @returns {Promise} 返回包含更新结果的Promise
 */
function updatePoemDataFromUrl(url = DEFAULT_POEM_DATA_URL) {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '正在下载数据...',
    });
    
    // 发起HTTP请求下载数据
    wx.request({
      url: url,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          try {
            // 将数据写入本地文件
            fs.writeFileSync(
              LOCAL_POEM_DATA_PATH,
              res.data,
              'utf8'
            );
            
            // 保存版本信息和来源信息
            const now = new Date();
            const version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            const source = url === DEFAULT_POEM_DATA_URL ? '官方数据源' : '自定义数据源';
            
            wx.setStorageSync(DATA_VERSION_KEY, version);
            wx.setStorageSync(DATA_SOURCE_KEY, source);
            
            wx.hideLoading();
            resolve({
              success: true,
              version,
              source
            });
          } catch (err) {
            wx.hideLoading();
            reject({
              success: false,
              error: '保存数据失败: ' + err.message
            });
          }
        } else {
          wx.hideLoading();
          reject({
            success: false,
            error: '下载数据失败: ' + res.statusCode
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject({
          success: false,
          error: '网络请求失败: ' + err.errMsg
        });
      }
    });
  });
}

/**
 * 从本地文件导入诗词数据
 * @param {string} tempFilePath 临时文件路径
 * @returns {Promise} 返回包含更新结果的Promise
 */
function importPoemDataFromFile(tempFilePath) {
  return new Promise((resolve, reject) => {
    try {
      // 读取临时文件内容
      fs.readFile({
        filePath: tempFilePath,
        encoding: 'utf8',
        success: (res) => {
          try {
            // 将内容写入到本地诗词数据文件
            fs.writeFileSync(
              LOCAL_POEM_DATA_PATH,
              res.data,
              'utf8'
            );
            
            // 保存版本信息
            const now = new Date();
            const version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            const source = '本地导入';
            
            wx.setStorageSync(DATA_VERSION_KEY, version);
            wx.setStorageSync(DATA_SOURCE_KEY, source);
            
            resolve({
              success: true,
              version,
              source
            });
          } catch (err) {
            reject({
              success: false,
              error: '保存数据失败: ' + err.message
            });
          }
        },
        fail: (err) => {
          reject({
            success: false,
            error: '读取文件失败: ' + err.errMsg
          });
        }
      });
    } catch (err) {
      reject({
        success: false,
        error: '导入数据失败: ' + err.message
      });
    }
  });
}

/**
 * 获取当前诗词数据的版本信息
 * @returns {object} 包含version和source的对象
 */
function getPoemDataInfo() {
  try {
    const version = wx.getStorageSync(DATA_VERSION_KEY) || '';
    const source = wx.getStorageSync(DATA_SOURCE_KEY) || '唐诗三百首（默认）';
    return { version, source };
  } catch (e) {
    return { version: '', source: '唐诗三百首（默认）' };
  }
}

module.exports = {
  parsePoems,
  searchPoemsByChar,
  updatePoemDataFromUrl,
  importPoemDataFromFile,
  getPoemDataInfo,
  initPoemDataInfo,
  DEFAULT_POEM_DATA_URL
};
