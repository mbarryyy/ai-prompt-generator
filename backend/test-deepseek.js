const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
const envPath = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: envPath });

console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.substring(0, 5) + '...' : '未设置');

// 初始化OpenAI客户端（用于连接DeepSeek API）
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

async function main() {
  try {
    console.log('尝试连接DeepSeek API...');
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, can you help me test the API connection?" }
      ]
    });

    console.log('API响应成功!');
    console.log('响应内容:', completion.choices[0].message.content);
  } catch (error) {
    console.error('API连接失败:', error);
  }
}

main(); 