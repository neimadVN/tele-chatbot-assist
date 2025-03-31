module.exports = {
  apps: [
    {
      name: 'assistant-chatbot',
      script: '/root/tele-chatbot-assist/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      // Make sure dotenv is loaded before the application starts
      node_args: '-r dotenv/config',
      // Log files
      error_file: '/root/tele-chatbot-assist/logs/assistant-error.log',
      out_file: '/root/tele-chatbot-assist/logs/assistant-out.log',
      // Merge out and error logs
      merge_logs: true,
      // Time format in logs
      time: true,
      // Ignore watch for node_modules and logs folders
      ignore_watch: ["node_modules", "logs"],
      // Wait before forcing a restart
      kill_timeout: 3000,
      // Wait before restarting app
      restart_delay: 2000,
    },
  ]
}; 