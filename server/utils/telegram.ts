import TelegramBot from 'node-telegram-bot-api';

const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
  : null;

const chatId = process.env.TELEGRAM_CHAT_ID || '';

export async function notifyNewGeneration(data: {
  userName: string;
  userEmail: string;
  userPhone?: string;
  prompt: string;
  imageUrl: string;
  creditsRemaining: number;
}) {
  if (!bot || !chatId) {
    console.warn('⚠️  Telegram not configured, skipping notification');
    return;
  }

  const message = `🎨 *NOVA ESTAMPA GERADA!*

👤 *Cliente:* ${data.userName || 'Sem nome'}
📧 *Email:* ${data.userEmail}
${data.userPhone ? `📱 *Telefone:* ${data.userPhone}` : ''}

📝 *Prompt:* ${data.prompt.slice(0, 200)}${data.prompt.length > 200 ? '...' : ''}

💳 *Créditos restantes:* ${data.creditsRemaining}

🔗 [Ver imagem](${data.imageUrl})

_Entre em contato para fechar a venda!_`;

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
    console.log('✅ Telegram notification sent');
  } catch (error) {
    console.error('❌ Telegram notification failed:', error);
  }
}
