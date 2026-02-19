import nodemailer from 'nodemailer';

// Configurar transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface WelcomeEmailData {
  name: string;
  email: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Gmail not configured, skipping welcome email');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00843D 0%, #FFD700 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #00843D;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .credits {
          background: #FFD700;
          color: #000;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
          margin: 20px 0;
          font-size: 18px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎨 Bem-vindo à Bravos Brasil!</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${data.name}</strong>! 👋</p>
        
        <p>É um prazer ter você conosco! Sua conta foi criada com sucesso.</p>
        
        <div class="credits">
          🎁 Você ganhou 5 CRÉDITOS GRÁTIS!
        </div>
        
        <p><strong>O que você pode fazer agora:</strong></p>
        <ul>
          <li>✨ Criar até 5 estampas exclusivas com IA</li>
          <li>📸 Enviar suas fotos para personalizar</li>
          <li>🎨 Gerar artes profissionais em segundos</li>
          <li>💬 Fazer pedidos direto pelo WhatsApp</li>
        </ul>
        
        <p style="text-align: center;">
          <a href="https://bravosbrasil.com.br" class="button">
            Criar Minha Primeira Estampa →
          </a>
        </p>
        
        <p><strong>Como funciona:</strong></p>
        <ol>
          <li>Descreva a estampa que você quer (ou envie uma foto)</li>
          <li>Nossa IA cria uma arte profissional em segundos</li>
          <li>Aprove e faça o pedido pelo WhatsApp</li>
          <li>Receba sua camiseta personalizada em casa!</li>
        </ol>
        
        <p>Qualquer dúvida, estamos à disposição!</p>
        
        <p>Abraços,<br>
        <strong>Equipe Bravos Brasil 🇧🇷</strong></p>
      </div>
      <div class="footer">
        <p>Bravos Brasil - Estampas Personalizadas com Inteligência Artificial</p>
        <p>bravosbrasil.com.br</p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Bravos Brasil 🇧🇷" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: '🎉 Bem-vindo à Bravos Brasil - 5 Créditos Grátis!',
      html: htmlContent,
    });
    console.log('✅ Welcome email sent to:', data.email);
  } catch (error) {
    console.error('❌ Welcome email failed:', error);
  }
}

export async function sendVerificationEmail(data: { name: string; email: string; token: string }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Email não configurado');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Bravos Brasil" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: 'Confirme seu e-mail — Bravos Brasil',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #00843D; font-size: 24px; margin-bottom: 8px;">Confirme seu e-mail</h2>
          <p style="color: #374151; margin-bottom: 24px;">Olá, ${data.name}! Use o código abaixo para confirmar sua conta:</p>
          <div style="background: #f9fafb; border: 2px dashed #00843D; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: bold; color: #002776; letter-spacing: 8px;">${data.token}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">O código expira em <strong>15 minutos</strong>.</p>
          <p style="color: #6b7280; font-size: 14px;">Se não foi você, ignore este e-mail.</p>
        </div>
      `,
    });
    console.log('✅ Verification email sent to:', data.email);
  } catch (err) {
    console.error('Erro ao enviar e-mail de verificação:', err);
  }
}

export interface OrderConfirmationData {
  name: string;
  email: string;
  orderId: string;
  total: number;
  shippingCost: number;
  couponCode?: string;
  couponDiscount: number;
  items: { name: string; color: string; size: string; quantity: number; unitPrice: number }[];
  shippingAddress: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-family: Arial, sans-serif; font-size: 14px; color: #374151;">
        ${item.name}${item.color ? ` — ${item.color}` : ''}${item.size ? ` / ${item.size}` : ''}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: center; font-family: Arial, sans-serif; font-size: 14px; color: #374151;">
        ${item.quantity}x
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-family: Arial, sans-serif; font-size: 14px; color: #374151;">
        R$ ${(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
      </td>
    </tr>
  `
    )
    .join('');

  try {
    await transporter.sendMail({
      from: `"Bravos Brasil" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: `✅ Pedido confirmado — Bravos Brasil #${data.orderId.slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #fff;">
          
          <!-- Header -->
          <div style="background: #00843D; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #FFCC29; font-size: 28px; margin: 0; letter-spacing: 2px;">BRAVOS BRASIL</h1>
            <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Pedido confirmado com sucesso!</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
              Olá, <strong>${data.name}</strong>! 🎉<br>
              Seu pagamento foi aprovado e seu pedido está sendo preparado.
            </p>

            <!-- Número do pedido -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Número do pedido</p>
              <p style="color: #002776; font-size: 20px; font-weight: bold; margin: 0;">#${data.orderId.slice(-6).toUpperCase()}</p>
            </div>

            <!-- Itens -->
            <h3 style="color: #00843D; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Itens do pedido</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              ${itemsHtml}
            </table>

            <!-- Totais -->
            <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
              ${data.shippingCost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Frete</span>
                <span style="color: #374151; font-size: 14px;">R$ ${data.shippingCost.toFixed(2).replace('.', ',')}</span>
              </div>` : `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Frete</span>
                <span style="color: #00843D; font-size: 14px; font-weight: bold;">Grátis</span>
              </div>`}
              ${data.couponDiscount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Cupom ${data.couponCode ?? ''}</span>
                <span style="color: #00843D; font-size: 14px;">− R$ ${data.couponDiscount.toFixed(2).replace('.', ',')}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                <span style="color: #111827; font-size: 16px; font-weight: bold;">Total</span>
                <span style="color: #00843D; font-size: 18px; font-weight: bold;">R$ ${data.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <!-- Endereço -->
            ${data.shippingAddress ? `
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Endereço de entrega</p>
              <p style="color: #374151; font-size: 14px; margin: 0;">${data.shippingAddress}</p>
            </div>` : ''}

            <!-- CTA -->
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://bravosbrasil.com.br" style="display: inline-block; background: #00843D; color: #FFCC29; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 50px; letter-spacing: 1px;">
                VER MINHA CONTA
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Dúvidas? Entre em contato via WhatsApp ou responda este e-mail.<br>
              Bravos Brasil — Veste seus valores.
            </p>
          </div>
        </div>
      `,
    });
    console.log('✅ Order confirmation email sent to:', data.email);
  } catch (err) {
    console.error('Erro ao enviar email de confirmação de pedido:', err);
  }
}
