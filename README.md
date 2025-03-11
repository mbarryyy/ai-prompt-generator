<p align="center">
  <img src="https://raw.githubusercontent.com/mbarryyy/ai-prompt-generator/main/src/logo.png" alt="AI Prompt Builder" width="120" />
</p>

<h1 align="center">🧠 AI Prompt Builder</h1>

<p align="center">
  <strong>Build better AI prompts with intelligent vocabulary suggestions and semantic structure.</strong><br>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-interface">Interface</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19.0.0-blue" alt="React" />
  <img src="https://img.shields.io/badge/node-v16%2B-green" alt="Node.js" />
  <img src="https://img.shields.io/badge/express-4.21.2-lightgrey" alt="Express" />
  <img src="https://img.shields.io/badge/deepseek-API-orange" alt="DeepSeek API" />
</p>

---

## 📖 Introduction

AI Prompt Builder is a sophisticated tool designed to help users create more effective prompts for AI systems like ChatGPT. By analyzing your initial idea, it generates a semantic vocabulary tree with relevant words, allowing you to construct prompts that yield better responses from AI models.

The app features a bilingual interface (English and Chinese) and leverages the DeepSeek API to provide intelligent vocabulary suggestions organized in an intuitive hierarchical structure.

## ✨ Features

- **Intelligent Prompt Analysis**: Enter your idea and get a structured vocabulary tree
- **Smart Word Selection**: Choose from suggested words to enrich your prompt
- **Prompt Optimization**: Generate polished prompts based on your selections
- **Bilingual Support**: Full support for both English and Chinese inputs and interface
- **Elegant UI**: Apple-inspired design with smooth animations and transitions
- **Copy Functionality**: One-click copy for generated prompts
- **Real-time Feedback**: Visual indicators when adding words to your prompt
- **Auto-scrolling**: Automatically highlights newly generated content
- **Mobile Responsive**: Works seamlessly on devices of all sizes

## 🎮 Demo

Try out the application by:

1. Enter an idea like "I want to develop a website" or "我想去欧洲旅游"
2. Browse the vocabulary tree and click on relevant words
3. Click "Generate Sentence" to create an optimized prompt
4. Use the language switcher (globe icon) to toggle between English and Chinese

## 🖥 Interface

The application features a clean, intuitive interface with several key components:

### Main Interface
The main screen includes a modern, minimalist input area where users can type their ideas, accompanied by a prominently displayed "Generate Prompt" button. The UI follows Apple's design principles with carefully chosen typography, spacing, and subtle animations.

### Vocabulary Tree
Once a prompt is generated, the app displays an interactive vocabulary tree that organizes relevant words in a hierarchical structure. Each category can be expanded or collapsed, and words can be selected with a simple click. When a word is selected, a subtle animation and visual indicator confirm the action.

### Language Switcher
Located in the top-right corner, the language switcher features a globe icon that rotates slightly on hover. Clicking it reveals a dropdown menu with language options (English and Chinese), each with appropriate styling and a checkmark indicating the current selection.

### Generated Prompt Section
The final generated prompt is displayed in a distinct section with a title and descriptive text. The prompt itself appears in a highlighted box with appropriate styling, and a copy button allows for one-click copying of the entire prompt.

## 🛠️ Tech Stack

### Frontend
- **React.js** (v19.0.0) - Core UI framework
- **CSS3** - Custom styling with animations and transitions
- **React TreeView** - For hierarchical data visualization
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime environment
- **Express** - Web application framework
- **DeepSeek API** - AI language model integration
- **Node-Cache** - For usage limitation and caching

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- DeepSeek API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mbarryyy/ai-prompt-project.git
   cd ai-prompt-project
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Return to root and install frontend dependencies
   cd ..
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the project root:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

4. **Start the application**
   ```bash
   # Start backend server (runs on port 3002)
   cd backend
   npm start

   # In a new terminal window, start frontend
   cd ..
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📋 Usage

### Creating a Prompt

1. **Enter your idea** in the input field at the top of the page
2. **Click "Generate Prompt"** to receive a vocabulary tree based on your input
3. **Browse the vocabulary tree** and click on words to add them to your selection
4. **Click "Generate Sentence"** to create an optimized prompt with your selected words
5. **Copy the generated prompt** by clicking the copy button
6. Use the prompt with ChatGPT or other AI tools for better results

### Language Switching

- Click the globe icon in the top-right corner to toggle between English and Chinese
- The interface language will update automatically based on your input language
- You can manually select your preferred language at any time

## 🔌 API Endpoints

The backend provides several endpoints:

### `/generate` (POST)
Generates a vocabulary tree based on user input
```json
// Request
{
  "input": "I want to develop a website"
}

// Response
{
  "tree": {
    "Website Purpose": {
      "Business": ["E-commerce", "Portfolio", "Corporate", "Blog"],
      // More categories and terms...
    }
  },
  "usage": {
    "remaining": 99,
    "limit": 100
  }
}
```

### `/optimize-prompt` (POST)
Creates an optimized prompt using the user's input and selected words
```json
// Request
{
  "originalInput": "I want to develop a website",
  "selectedWords": ["React", "E-commerce", "Responsive"],
  "includeEndingSentence": true
}

// Response
{
  "success": true,
  "optimizedPrompt": "I want to develop a responsive e-commerce website using React",
  "endingSentence": "Please provide code implementation ideas and step-by-step guidance."
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌐 Deployment

You can deploy this application to various platforms:

### Vercel/Netlify (Frontend)
The React frontend can be easily deployed to Vercel or Netlify with these steps:
1. Connect your GitHub repository
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
3. Deploy!

### Heroku/Railway (Backend)
The Node.js backend can be deployed to platforms like Heroku or Railway:
1. Add a `Procfile` in the backend directory with: `web: node server.js`
2. Configure environment variables for your DeepSeek API key
3. Deploy the backend directory

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/mbarryyy">mbarryyy</a>
</p>
