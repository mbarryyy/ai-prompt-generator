# 🚀 AI Prompt Builder API

<p align="center">
  <img src="https://img.shields.io/badge/node.js-v16+-green" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/express-4.21.2-blue" alt="Express Version" />
  <img src="https://img.shields.io/badge/openai_sdk-4.86.2-orange" alt="OpenAI SDK Version" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License" />
</p>

Backend service for the AI Prompt Builder application, leveraging DeepSeek AI API to generate semantic vocabulary trees and optimize prompts for AI interactions.

## 📋 Table of Contents

- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Architecture](#architecture)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Vocabulary Tree Generation**: Creates structured hierarchical word suggestions based on user input
- **Prompt Optimization**: Transforms selected words into coherent, effective AI prompts
- **Bilingual Support**: Full support for both English and Chinese inputs and outputs
- **Rate Limiting**: Per-user daily request limits to prevent abuse (configurable)
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes and messages
- **Timeout Management**: 30-second timeout for API calls to ensure stability
- **API Health Checking**: Endpoints for monitoring server status and API connectivity

## 🔌 API Endpoints

### Status Check
```http
GET /status
```
Checks if the server is running properly.

**Response Example**:
```json
{
  "status": "online",
  "message": "Server is running",
  "timestamp": "2023-03-10T10:30:25.771Z"
}
```

### API Connection Test
```http
GET /test-api
```
Tests the connection to the DeepSeek API.

**Response Example**:
```json
{
  "success": true,
  "message": "DeepSeek API connection successful",
  "response": "..."
}
```

### Generate Vocabulary Tree
```http
POST /generate
```
Generates a semantic vocabulary tree based on user input.

**Request Body**:
```json
{
  "input": "I want to develop a website"
}
```

**Response Example**:
```json
{
  "tree": {
    "Website Purpose": {
      "Business": ["E-commerce", "Portfolio", "Corporate", "Blog"],
      "Personal": ["Portfolio", "Blog", "Resume"]
    },
    "Technologies": {
      "Frontend": ["React", "Vue", "Angular"],
      "Backend": ["Node.js", "Python", "Ruby"]
    }
  },
  "usage": {
    "remaining": 99,
    "limit": 100
  }
}
```

### Optimize Prompt
```http
POST /optimize-prompt
```
Creates a coherent prompt based on user input and selected vocabulary.

**Request Body**:
```json
{
  "originalInput": "I want to develop a website",
  "selectedWords": ["React", "E-commerce", "Responsive"],
  "includeEndingSentence": true
}
```

**Response Example**:
```json
{
  "success": true,
  "optimizedPrompt": "I want to develop a responsive e-commerce website using React",
  "endingSentence": "Please provide code implementation ideas and step-by-step guidance."
}
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mbarryyy/ai-prompt-project.git
   cd ai-prompt-project/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 🔐 Environment Variables

Create a `.env` file in the project root directory with the following variables:

```
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## 🚀 Usage

Start the server:

```bash
node server.js
```

The server will run on http://localhost:3002 by default.

For development with auto-restart:

```bash
npm run dev
```

## 🏗️ Architecture

The backend follows a straightforward Express.js architecture:

- **server.js**: Main entry point and route definitions
- **API Handlers**: Separate functions for each API endpoint
- **Middleware**: Rate limiting, error handling, and CORS support
- **External API Integration**: DeepSeek API connection via OpenAI SDK

### Key Technologies

- **Express.js**: Web server framework
- **OpenAI SDK**: Client for DeepSeek API communication
- **Node-Cache**: In-memory caching for rate limiting
- **Dotenv**: Environment variable management

## ⚠️ Error Handling

The API implements comprehensive error handling:

- **4xx Errors**: Client errors (invalid input, rate limits)
- **5xx Errors**: Server errors (API connection failures)
- **Logging**: Detailed error logging for debugging

## 🚦 Rate Limiting

User rate limiting is implemented with the following strategy:

- Default: 100 requests per day per IP address
- In-memory cache with 24-hour TTL
- Remaining usage count returned with each API response

## 🔍 Troubleshooting

If you encounter API connection issues:

1. Verify your DeepSeek API key is correct
2. Use the `/test-api` endpoint to test API connectivity
3. Check network access to the DeepSeek API
4. Review server logs for detailed error information
5. Ensure your environment variables are properly configured

---

<p align="center">
  <img src="./src/logo.png" alt="AI Prompt Builder" width="120" />
  Made with ❤️ by <a href="https://github.com/mbarryyy">mbarryyy</a>
</p> 