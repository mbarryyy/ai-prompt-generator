const express = require('express');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const https = require('https');

// 加载环境变量
console.log('当前工作目录:', process.cwd());
const envPath = path.resolve(process.cwd(), '..', '.env');
console.log('尝试加载环境变量从:', envPath);
console.log('该文件是否存在:', fs.existsSync(envPath) ? '是' : '否');

dotenv.config({ path: envPath });

console.log('环境变量加载后:');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.substring(0, 5) + '...' : '未设置');

// 创建一个自定义的HTTPS代理，设置较长的超时时间（30秒）
const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: 30000,
});

// 初始化OpenAI客户端（用于连接DeepSeek API）
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',  // 正确的基础URL
  apiKey: process.env.DEEPSEEK_API_KEY,
  httpAgent: httpsAgent, // 使用自定义代理提高稳定性
  timeout: 30000, // 30秒超时设置
});

const app = express();
app.use(express.json());

// 加强CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 创建缓存用于追踪用户使用次数
const userLimitCache = new NodeCache({ stdTTL: 86400 }); // 24小时过期
const MAX_DAILY_REQUESTS = 100; // 已从5次增加到100次，测试用

// 处理直接调用DeepSeek API的辅助函数
async function callDeepSeekAPI(messages) {
  console.log('准备调用DeepSeek API，消息数量:', messages.length);
  
  try {
    console.log('开始请求DeepSeek API...');
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: false,
      timeout: 30000, // 30秒超时
    });
    
    const endTime = Date.now();
    console.log(`DeepSeek API请求成功! 耗时: ${endTime - startTime}ms`);
    return completion;
  } catch (error) {
    console.error('DeepSeek API请求失败:', error.message);
    if (error.response) {
      console.error('API响应状态:', error.response.status);
      console.error('API响应数据:', error.response.data);
    }
    throw error; // 重新抛出错误，由调用方处理
  }
}

// 添加一个函数来检测语言
function detectLanguage(text) {
  // 简单检测方法：根据字符集特征判断
  // 检查是否主要为英文字符
  if (!text || typeof text !== 'string') return "english"; // 如无有效输入，返回默认语言（英文）
  
  const englishPattern = /^[a-zA-Z0-9\s.,!?;:'"-]+$/;
  // 如果文本主要为英文字符，则判定为英文
  if (englishPattern.test(text.trim())) {
    return "english";
  }
  // 否则默认为中文
  return "chinese";
}

// 从API响应中提取JSON
function extractJSONFromResponse(text) {
  try {
    // 提取JSON部分
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonText = jsonMatch[0];
      console.log('提取JSON部分:', jsonText);
      
      // 替换可能存在的中文引号和标点
      jsonText = jsonText
        .replace(/[""]|['']|['"]/g, '"')
        .replace(/[，]/g, ',')
        .replace(/[：]/g, ':');
      
      // 解析JSON
      const treeData = JSON.parse(jsonText);
      
      // 验证对象结构 - 确保有tree字段
      if (!treeData.tree) {
        console.log('API返回的JSON没有tree字段，尝试重新格式化');
        // 如果没有tree字段，但有其他结构化字段，则添加tree包装
        if (treeData.Actions || treeData.Objects || treeData.Qualities || 
            treeData.verbs || treeData.nouns || treeData.adjectives) {
          return {
            tree: treeData
          };
        } else {
          console.error('API返回的JSON结构不符合预期:', treeData);
          throw new Error('API返回的JSON结构不完整');
        }
      }
      
      console.log('成功解析词汇树结构');
      return treeData;
    } else {
      throw new Error('无法从响应中提取JSON');
    }
  } catch (e) {
    console.error('JSON解析错误:', e.message);
    console.error('解析失败的内容:', text);
    throw new Error('无法解析API返回的内容为JSON格式: ' + e.message);
  }
}

// 调用DeepSeek API生成树状结构的提示词
async function generateWordTree(userInput) {
  try {
    console.log('使用OpenAI SDK尝试调用DeepSeek API...');
    console.log('用户输入:', userInput);
    
    // 检测用户输入的语言
    const language = detectLanguage(userInput);
    console.log('检测到用户输入语言:', language);
    
    // 构建根据语言的提示信息
    let systemPrompt, userPrompt;
    
    if (language === "english") {
      systemPrompt = "You are a professional AI prompt generator. Please create a hierarchical tree structure, not a flat list. Return strictly in the required nested JSON format without adding any extra explanations or text.";
      
      userPrompt = `Based on the user's idea: "${userInput}", generate a hierarchical tree JSON structure.
      The structure should have the following characteristics:
      1. The top level should contain 3-5 major categories, which should be dynamically determined based on the user's input content, rather than fixed categories. For example, for "I want to cook a meal", possible major categories might be "Cooking Methods", "Ingredient Types", "Kitchen Tools", "Cuisine Styles", etc.
      2. Each major category should have 2-4 subcategories
      3. Each subcategory should include 3-5 specific vocabulary items

      IMPORTANT: Since the user is writing in English, ALL category names and vocabulary words MUST be in English.

      For example, for the input "I want to cook a meal", it might generate:
      {
        "tree": {
          "Cooking Methods": {
            "Hot Processing": ["Stir-fry", "Pan-fry", "Stew", "Steam"],
            "Cold Processing": ["Mix", "Marinate", "Cut", "Blend"]
          },
          "Ingredient Selection": {
            "Staples": ["Rice", "Noodles", "Bread"],
            "Proteins": ["Meat", "Tofu", "Eggs"],
            "Vegetables": ["Greens", "Carrots", "Potatoes"]
          },
          "Flavor Styles": {
            "Tastes": ["Savory", "Spicy", "Mild"],
            "Cuisines": ["Sichuan", "Cantonese", "Northeast"]
          },
          "Cooking Tools": {
            "Cookware": ["Pot", "Spatula", "Bowl"],
            "Auxiliary Tools": ["Knife", "Cutting Board", "Chopsticks"]
          }
        }
      }

      Please ensure the JSON structure contains only the "tree" field as the top-level key, and follow the exact format shown in the example. The content should be in English to match the user's input language.`;
    } else {
      // 中文提示
      systemPrompt = "你是一个专业的AI提示词生成助手。请生成一个层次化的树状结构，不是扁平的列表。请严格按照要求的嵌套JSON格式返回，不要添加任何额外的说明或文本。";
      
      userPrompt = `基于用户的想法："${userInput}"，生成一个层次化的树状JSON结构。
      结构应该有以下特点：
      1. 最顶层包含3-5个大类别，这些类别应该根据用户输入内容动态确定，而不是固定的类别。例如，对于"我想做一顿饭"，可能的大类别有"烹饪方法"、"食材类型"、"厨房工具"、"菜系风格"等。
      2. 每个大类别下有2-4个子类别
      3. 每个子类别下包含3-5个具体的词汇

      重要：由于用户使用中文输入，所有类别名称和词汇必须使用中文。

      例如，输入"我想做一顿饭"可能生成：
      {
        "tree": {
          "烹饪方法": {
            "热加工": ["炒", "煎", "炖", "蒸"],
            "冷加工": ["拌", "腌", "切", "混合"]
          },
          "食材选择": {
            "主食": ["米饭", "面条", "馒头"],
            "蛋白质": ["肉类", "豆制品", "鸡蛋"],
            "蔬菜": ["青菜", "胡萝卜", "土豆"]
          },
          "味道风格": {
            "口味": ["咸鲜", "麻辣", "清淡"],
            "菜系": ["川菜", "粤菜", "东北菜"]
          },
          "烹饪工具": {
            "炊具": ["锅", "铲", "碗"],
            "辅助工具": ["菜刀", "砧板", "筷子"]
          }
        }
      }

      请确保JSON结构仅包含"tree"作为顶级字段，并遵照示例中的精确格式。内容应该与用户的输入语言匹配，使用中文。`;
    }
    
    // 构建请求消息 - 修改为允许动态生成大类别的层次化结构
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ];
    
    // 调用API
    const completion = await callDeepSeekAPI(messages);
    
    // 从API响应中提取内容
    const contentText = completion.choices[0].message.content;
    console.log('原始API返回内容:', contentText);
    
    // 尝试解析响应中的JSON
    try {
      // 检查是否为Markdown代码块格式
      if (contentText.includes('```json')) {
        // 从Markdown代码块中提取JSON
        const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonContent = jsonMatch[1].trim();
          console.log('从Markdown代码块中提取JSON:', jsonContent);
          // 提取纯JSON部分
          const jsonData = extractJSONFromResponse(jsonContent);
          return jsonData;
        }
      }
      
      // 提取纯JSON部分
      const jsonData = extractJSONFromResponse(contentText);
      return jsonData;
    } catch (error) {
      console.error('解析词汇树JSON失败:', error);
      // 返回默认树状结构，根据输入语言选择适当的语言
      return language === "english" ? getDefaultEnglishTree() : getDefaultChineseTree();
    }
  } catch (error) {
    console.error('生成词汇树时出错:', error);
    // 根据输入语言返回默认树
    const language = detectLanguage(userInput);
    return language === "english" ? getDefaultEnglishTree() : getDefaultChineseTree();
  }
}

// 默认的英文树结构
function getDefaultEnglishTree() {
  return {
    tree: {
      "Actions": {
        "Basic": ["Create", "Develop", "Build", "Design"],
        "Advanced": ["Optimize", "Enhance", "Implement", "Integrate"]
      },
      "Objects": {
        "Digital": ["Website", "App", "Software", "Platform"],
        "Physical": ["Product", "Device", "Tool", "Material"]
      },
      "Qualities": {
        "Performance": ["Fast", "Reliable", "Efficient", "Responsive"],
        "Appearance": ["Modern", "Clean", "Beautiful", "Intuitive"]
      }
    }
  };
}

// 默认的中文树结构
function getDefaultChineseTree() {
  return {
    tree: {
      "动作": {
        "基础": ["创建", "开发", "构建", "设计"],
        "高级": ["优化", "增强", "实现", "集成"]
      },
      "对象": {
        "数字": ["网站", "应用", "软件", "平台"],
        "实体": ["产品", "设备", "工具", "材料"]
      },
      "特质": {
        "性能": ["快速", "可靠", "高效", "响应式"],
        "外观": ["现代", "简洁", "美观", "直观"]
      }
    }
  };
}

// 获取或初始化用户的使用次数
function getUserRequestCount(userId) {
  const count = userLimitCache.get(userId);
  return count || 0;
}

// 增加用户的使用次数
function incrementUserRequestCount(userId) {
  const currentCount = getUserRequestCount(userId);
  userLimitCache.set(userId, currentCount + 1);
  return currentCount + 1;
}

// 服务器状态检查接口
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// 直接测试DeepSeek API的接口
app.get('/test-api', async (req, res) => {
  try {
    const testMessages = [
      { role: "user", content: "请返回一个简单的JSON: {\"success\": true}" }
    ];
    
    const completion = await callDeepSeekAPI(testMessages);
    
    res.json({
      success: true,
      message: "DeepSeek API连接成功",
      response: completion.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "DeepSeek API连接失败",
      error: error.message
    });
  }
});

// 主要的生成接口
app.post('/generate', async (req, res) => {
  console.log('收到/generate请求:', req.body);
  const userInput = req.body.input;
  
  if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
    const language = detectLanguage(userInput) || "english";
    return res.status(400).json({
      error: language === "english" ? 'Invalid input' : '无效的输入',
      message: language === "english" ? 'Please provide a non-empty text input' : '请提供非空的文本输入'
    });
  }
  
  console.log('处理用户输入:', userInput);
  
  // 使用IP地址作为简单的用户标识（实际应用中应使用更安全的用户标识方法）
  const userId = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
  console.log('用户标识:', userId);
  
  // 检测用户输入的语言
  const language = detectLanguage(userInput);
  console.log('检测到用户输入语言:', language);
  
  // 检查用户是否超出每日使用限制
  const requestCount = getUserRequestCount(userId);
  console.log('用户当前请求次数:', requestCount, '/', MAX_DAILY_REQUESTS);
  
  if (requestCount >= MAX_DAILY_REQUESTS) {
    console.log('用户达到请求限制');
    return res.status(429).json({
      error: language === "english" ? 'Daily limit reached' : '已达到今日使用限制',
      message: language === "english" ? 
        `Please try again tomorrow. Daily limit is ${MAX_DAILY_REQUESTS} requests.` : 
        `请明天再来尝试，每日限制${MAX_DAILY_REQUESTS}次请求。`,
      usage: {
        remaining: 0,
        limit: MAX_DAILY_REQUESTS
      }
    });
  }
  
  try {
    console.log('开始生成词汇树...');
    // 生成树状结构
    const wordTreeData = await generateWordTree(userInput);
    
    // 增加用户使用次数
    const newCount = incrementUserRequestCount(userId);
    const remainingRequests = MAX_DAILY_REQUESTS - newCount;
    console.log('用户剩余请求次数:', remainingRequests);
    
    // 返回结果和剩余请求次数
    const response = {
      ...wordTreeData,
      usage: {
        remaining: remainingRequests >= 0 ? remainingRequests : 0,
        limit: MAX_DAILY_REQUESTS
      }
    };
    
    console.log('响应数据结构:', Object.keys(response));
    
    res.json(response);
  } catch (error) {
    console.error('处理请求时出错:', error);
    res.status(500).json({
      error: language === "english" ? 'Internal server error' : '服务器内部错误',
      message: error.message,
      usage: {
        remaining: MAX_DAILY_REQUESTS - getUserRequestCount(userId),
        limit: MAX_DAILY_REQUESTS
      }
    });
  }
});

// 添加一个新函数用于生成优化的提示词句子
async function generateOptimizedPrompt(userInput, selectedWords, includeEndingSentence = false) {
  try {
    console.log('使用OpenAI SDK调用DeepSeek API生成优化句子...');
    console.log('用户原始输入:', userInput);
    console.log('用户选择的词汇:', selectedWords);
    console.log('是否生成结尾句:', includeEndingSentence);
    
    // 检测用户输入的语言
    const language = detectLanguage(userInput);
    console.log('检测到用户输入语言:', language);
    
    // 根据语言构建系统提示
    let systemPrompt, userPrompt;
    
    if (language === "english") {
      systemPrompt = "You are a professional AI prompt generator. Based on the user's original input and selected keywords, generate a smooth, coherent, and clear prompt sentence. Do not add any explanations, just return the optimized sentence directly.";
      
      userPrompt = `Original idea: "${userInput}"
      Selected vocabulary: "${selectedWords}"
      
      Based on the information above, generate a smooth, coherent, and clear prompt sentence, integrating these keywords reasonably into the sentence. The returned sentence should be grammatically correct, logically clear, and easy to understand. Do not include any additional explanations or instructions, only return the optimized sentence.${
        includeEndingSentence ? `

      Important: In addition to the main sentence, please also generate an ending request sentence that matches the context, to ask an AI for related help. For example, for travel planning, it might be "Please recommend detailed itinerary arrangements and booking suggestions"; for development needs, it might be "Please provide code implementation ideas and steps." The ending sentence should connect naturally, don't use generic sentences like "Please help me complete this task."
      
      Return format: {"mainSentence":"your main content","endingSentence":"your ending sentence"}` : ''
      }`;
    } else {
      // 中文提示
      systemPrompt = "你是一个专业的AI提示词生成助手。请根据用户的原始输入和选择的关键词，生成一个流畅、连贯、清晰的提示词句子。不要添加任何解释，直接返回优化后的句子。";
      
      userPrompt = `原始想法："${userInput}"
      选择的词汇："${selectedWords}"
      
      请根据以上信息，生成一个流畅、连贯、清晰的提示词句子，将这些关键词合理地融入到句子中。返回的句子应该语法正确、逻辑清晰、易于理解。不要包含任何额外的解释或说明，仅返回优化后的句子。${
        includeEndingSentence ? `

      重要：除了主句外，请额外生成一个与上下文相符的结尾请求句，用于向AI请求相关帮助。例如，对于旅游规划，可能是"请推荐详细的行程安排和预订建议"；对于开发需求，可能是"请提供代码实现思路和步骤"。结尾句应自然衔接，不要使用"请帮我完成这个任务"这类通用句。
      
      返回格式：{"主体句":"你的主体内容","结尾句":"你的结尾句"}` : ''
      }`;
    }
    
    // 构建请求消息
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ];
    
    // 调用API
    const completion = await callDeepSeekAPI(messages);
    
    // 从API响应中提取内容
    const responseContent = completion.choices[0].message.content.trim();
    
    // 处理响应内容
    if (includeEndingSentence) {
      try {
        // 尝试解析JSON格式的响应
        let jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // 清理并解析JSON
          let jsonString = jsonMatch[0].replace(/[""]|['']|['"]/g, '"').replace(/[，]/g, ',').replace(/[：]/g, ':');
          const parsedResponse = JSON.parse(jsonString);
          
          // 根据语言选择不同的默认字段和回退值
          if (language === "english") {
            return {
              mainSentence: parsedResponse.mainSentence || responseContent,
              endingSentence: parsedResponse.endingSentence || "Please provide detailed guidance and suggestions."
            };
          } else {
            return {
              mainSentence: parsedResponse.主体句 || parsedResponse.mainSentence || responseContent,
              endingSentence: parsedResponse.结尾句 || parsedResponse.endingSentence || "请提供详细的指导和建议。"
            };
          }
        }
      } catch (parseError) {
        console.log('JSON解析失败，使用完整响应作为主体句:', parseError.message);
      }
      
      // 如果解析失败，返回默认值，根据语言选择不同的默认值
      return {
        mainSentence: responseContent,
        endingSentence: language === "english" ? 
          "Please provide detailed guidance and suggestions." : 
          "请提供详细的指导和建议。"
      };
    } else {
      // 简单模式，只返回优化后的句子
      // 移除可能存在的额外引号和无关文本
      let cleanPrompt = responseContent;
      // 移除可能的引号包裹
      if (cleanPrompt.startsWith('"') && cleanPrompt.endsWith('"')) {
        cleanPrompt = cleanPrompt.substring(1, cleanPrompt.length - 1);
      }
      // 移除可能的Markdown格式
      if (cleanPrompt.includes('```')) {
        const matches = cleanPrompt.match(/```(?:.*?)\n([\s\S]*?)```/);
        if (matches && matches[1]) {
          cleanPrompt = matches[1].trim();
        }
      }
      
      return cleanPrompt;
    }
  } catch (error) {
    console.error('生成优化提示词失败:', error.message);
    throw error;
  }
}

// 添加新的API路由来处理优化提示词请求
app.post('/optimize-prompt', async (req, res) => {
  console.log('收到/optimize-prompt请求:', req.body);
  const { originalInput, selectedWords, includeEndingSentence } = req.body;
  
  if (!originalInput || !selectedWords) {
    // 检测用户输入的语言
    const language = originalInput ? detectLanguage(originalInput) : "chinese";
    
    return res.status(400).json({
      error: language === "english" ? 'Invalid input' : '无效的输入',
      message: language === "english" ? 
        'Please provide original input and selected vocabulary' : 
        '请提供原始输入和选择的词汇'
    });
  }
  
  console.log('处理提示词优化请求...');
  
  try {
    const result = await generateOptimizedPrompt(originalInput, selectedWords, includeEndingSentence);
    
    if (includeEndingSentence) {
      res.json({
        success: true,
        optimizedPrompt: result.mainSentence,
        endingSentence: result.endingSentence
      });
    } else {
      res.json({
        success: true,
        optimizedPrompt: result
      });
    }
  } catch (error) {
    console.error('处理提示词优化请求时出错:', error);
    const language = detectLanguage(originalInput);
    res.status(500).json({
      error: language === "english" ? 'Internal server error' : '服务器内部错误',
      message: error.message
    });
  }
});

// 确保服务器正确启动
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================`);
  console.log(`服务器启动成功! 运行于 http://localhost:${PORT}`);
  console.log(`状态检查: http://localhost:${PORT}/status`);
  console.log(`API测试: http://localhost:${PORT}/test-api`);
  console.log(`================================================`);
});

// 添加优雅关闭功能
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，准备关闭服务器');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});