const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载环境变量
const envPath = path.resolve(process.cwd(), '..', '.env');
console.log('尝试加载环境变量从:', envPath);
console.log('该文件是否存在:', fs.existsSync(envPath) ? '是' : '否');

dotenv.config({ path: envPath });

console.log('API密钥前五位:', process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.substring(0, 5) + '...' : '未设置');

// 初始化OpenAI客户端（用于连接DeepSeek API）
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
});

async function testAPI() {
  try {
    console.log('正在测试DeepSeek API连接...');
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "user", content: "Hello, can you respond with a simple JSON object with the structure: {\"success\": true, \"message\": \"API connection working!\"}?" }
      ],
      temperature: 0.7,
      max_tokens: 100,
      stream: false
    });
    
    console.log('响应成功!');
    console.log('响应内容:', completion.choices[0].message.content);
    
    try {
      const jsonResponse = JSON.parse(completion.choices[0].message.content);
      console.log('JSON解析成功:', jsonResponse);
    } catch (e) {
      console.log('无法解析为JSON，原始响应:', completion.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('API测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', JSON.stringify(error.response, null, 2));
    }
  }
}

testAPI(); 