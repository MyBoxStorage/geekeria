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
