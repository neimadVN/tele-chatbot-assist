import * as readline from 'readline';
import dotenv from 'dotenv';
import { createThread, addMessage, runAssistant } from './services/assistantService';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { TelegramSession } from './types';

dotenv.config();

// Check for required environment variables
if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANT_ID) {
  console.error('Error: OPENAI_API_KEY and ASSISTANT_ID must be set in .env file');
  process.exit(1);
}

// Check if running under PM2
const isPM2 = typeof process.env.pm_id !== 'undefined' || 
              process.env.NODE_APP_INSTANCE !== undefined || 
              process.env.PM2_HOME !== undefined;
const isProduction = process.env.NODE_ENV === 'production';

// ANSI color codes for formatting
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.green}Running in ${isProduction ? 'production' : 'development'} mode${colors.reset}`);
console.log(`${colors.green}Running under PM2: ${isPM2 ? 'Yes' : 'No'}${colors.reset}`);

// Create readline interface only when needed
let rl: readline.Interface | null = null;

// Telegram bot setup
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

// Track Telegram sessions (chatId -> threadId)
const telegramSessions = new Map<number, TelegramSession>();

// Initialize Telegram bot if token is available
if (telegramToken) {
  bot = new TelegramBot(telegramToken, { polling: true });
  
  // Handle /start command
  bot.onText(/\/start/, async (msg: Message) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'User';
    
    console.log(`${colors.green}New Telegram session from ${firstName} (${chatId})${colors.reset}`);
    
    // Create a new thread for this user
    const threadId = await createThread();
    
    // Store the session
    telegramSessions.set(chatId, {
      threadId,
      chatId,
      firstName,
      lastInteraction: new Date()
    });
    
    bot?.sendMessage(chatId, `👋 Hello ${firstName}! I'm your AI assistant. How can I help you today?`);
  });
  
  // Handle all other messages
  bot.on('message', async (msg: Message) => {
    // Ignore commands
    if (msg.text?.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    
    if (!userMessage) return;
    
    // Check if user has an active session
    let session = telegramSessions.get(chatId);
    
    // If no session exists, create one
    if (!session) {
      const threadId = await createThread();
      const firstName = msg.from?.first_name || 'User';
      
      session = {
        threadId,
        chatId,
        firstName,
        lastInteraction: new Date()
      };
      
      telegramSessions.set(chatId, session);
    }
    
    // Update last interaction time
    session.lastInteraction = new Date();
    
    // Show typing indicator
    bot?.sendChatAction(chatId, 'typing');
    
    try {
      // Add message to thread
      await addMessage(session.threadId, userMessage);
      
      // Run the assistant
      const response = await runAssistant(session.threadId);
      
      if (response) {
        const formattedResponse = formatResponse(response.content);
        bot?.sendMessage(chatId, formattedResponse);
      } else {
        bot?.sendMessage(chatId, "I'm sorry, I couldn't process your request.");
      }
    } catch (error) {
      console.error(`${colors.red}Error handling Telegram message:${colors.reset}`, error);
      bot?.sendMessage(chatId, "Sorry, I encountered an error while processing your message.");
    }
  });
  
  console.log(`${colors.green}Telegram bot started successfully${colors.reset}`);
} else {
  console.log(`${colors.yellow}TELEGRAM_BOT_TOKEN not found, Telegram bot will not start${colors.reset}`);
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  shutdown();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  shutdown();
});

// Graceful shutdown function
function shutdown() {
  if (rl) {
    console.log('Closing readline interface');
    rl.close();
  }
  
  if (bot) {
    console.log('Stopping Telegram bot');
    bot.stopPolling();
  }
  
  console.log('Exiting process');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Format the assistant's response
function formatResponse(content: any): string {
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (item.type === 'text') {
          return item.text.value;
        }
        return '';
      })
      .join('\n');
  }
  
  return String(content);
}

// Start the CLI chatbot
async function startCliChatbot() {
  // Create readline interface for CLI
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(`${colors.green}===================================${colors.reset}`);
  console.log(`${colors.blue}OpenAI Assistant Chatbot${colors.reset}`);
  console.log(`${colors.green}===================================${colors.reset}`);
  console.log(`${colors.cyan}Type 'exit' or 'quit' to end the conversation${colors.reset}`);
  console.log(`${colors.cyan}Starting a new conversation...${colors.reset}`);
  
  // Create a new thread for this conversation
  const threadId = await createThread();
  console.log(`${colors.yellow}Thread created: ${threadId}${colors.reset}`);
  console.log(`${colors.green}===================================${colors.reset}`);
  
  // Main chat loop
  let chatActive = true;
  
  while (chatActive) {
    const userInput = await askQuestion(`${colors.green}You: ${colors.reset}`);

    // Check if user input empty
    if (!userInput) {
      continue;
    }
    
    // Check for exit command
    if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      chatActive = false;
      console.log(`${colors.yellow}Ending conversation...${colors.reset}`);
      break;
    }
    
    // Add message to thread
    console.log(`${colors.cyan}Processing...${colors.reset}`);
    await addMessage(threadId, userInput);
    
    // Run the assistant
    const response = await runAssistant(threadId);
    
    if (response) {
      console.log(`${colors.blue}Assistant: ${colors.reset}${formatResponse(response.content)}`);
    } else {
      console.log(`${colors.red}Error: No response from assistant${colors.reset}`);
    }
    
    console.log(`${colors.green}===================================${colors.reset}`);
  }
  
  // We know rl is not null here since we created it at the start of this function
  rl.close();
}

// Function to ask a question and get user input
function askQuestion(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    // We can assert rl is not null here since this is only called from startCliChatbot
    // after rl has been initialized
    if (!rl) {
      throw new Error('Readline interface not initialized');
    }
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Only start CLI mode if not running under PM2
if (!isPM2) {
  // Start the CLI chatbot
  startCliChatbot().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    if (rl) {
      rl.close();
    }
    process.exit(1);
  });
} else {
  console.log(`${colors.green}Running under PM2. CLI chatbot disabled.${colors.reset}`);
} 