// utils/poem.js
const fs = wx.getFileSystemManager();

/**
 * 解析诗词内容，返回格式化的诗词数据
 * @returns {Array} 解析后的诗词数组，每项包含{title, author, content, source}
 */
function parsePoems() {
  try {
    // 读取诗词文件
    const content = fs.readFileSync(`${wx.env.USER_DATA_PATH}/poems_data.txt`, 'utf-8');
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
      const poemHeaderMatch = line.match(/^(\d{3})(.+?)：(.+)$/);
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
 * @returns {Array} 匹配的诗句数组，每项包含{line, author, title, source}
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
        results.push({
          line: line,
          author: poem.author,
          title: poem.title,
          source: poem.source
        });
      }
    });
  });
  
  return results;
}

module.exports = {
  parsePoems,
  searchPoemsByChar
};
