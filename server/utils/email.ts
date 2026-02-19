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

export async function sendWelcomeEmail(data: { name: string; email: string }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  try {
    await transporter.sendMail({
      from: `"Bravos Brasil" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: 'Bem-vindo à Bravos Brasil — Seus 5 créditos estão esperando',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">

          <!-- Header -->
          <div style="background: #00843D; padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <p style="color: #FFCC29; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">MODA PATRIÓTICA</p>
            <h1 style="color: #ffffff; font-size: 36px; margin: 0; letter-spacing: 4px; font-weight: 900;">BRAVOS BRASIL</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 12px 0 0; letter-spacing: 1px;">Veste seus valores</p>
          </div>

          <!-- Hero message -->
          <div style="background: #002776; padding: 32px; text-align: center;">
            <p style="color: #FFCC29; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">BEM-VINDO À FAMÍLIA</p>
            <h2 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Olá, ${data.name.split(' ')[0]}!</h2>
            <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 12px 0 0; line-height: 1.6;">Sua conta foi criada com sucesso.<br>Você já pode explorar toda a coleção patriótica.</p>
          </div>

          <!-- Credits badge -->
          <div style="padding: 32px; background: #f9fafb; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <div style="display: inline-block; background: #FFCC29; border-radius: 50px; padding: 16px 32px;">
              <p style="color: #002776; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 4px;">Presente de boas-vindas</p>
              <p style="color: #002776; font-size: 28px; font-weight: 900; margin: 0;">🎁 5 CRÉDITOS GRÁTIS</p>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0; line-height: 1.6;">Use seus créditos para criar estampas exclusivas<br>com Inteligência Artificial no Gerador de Estampas.</p>
          </div>

          <!-- Features -->
          <div style="padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <p style="color: #111827; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 20px;">O que você pode fazer agora</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 36px;">
                  <div style="width: 28px; height: 28px; background: #00843D; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px;">✦</div>
                </td>
                <td style="padding: 12px 0 12px 12px; border-bottom: 1px solid #f3f4f6;">
                  <p style="color: #111827; font-size: 14px; font-weight: bold; margin: 0 0 2px;">Explorar a Coleção Patriota</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">Camisetas exclusivas que celebram a brasilidade</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 36px;">
                  <div style="width: 28px; height: 28px; background: #00843D; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px;">✦</div>
                </td>
                <td style="padding: 12px 0 12px 12px; border-bottom: 1px solid #f3f4f6;">
                  <p style="color: #111827; font-size: 14px; font-weight: bold; margin: 0 0 2px;">Criar Estampas com IA</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">Gere artes exclusivas usando seus 5 créditos</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; vertical-align: top; width: 36px;">
                  <div style="width: 28px; height: 28px; background: #00843D; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px;">✦</div>
                </td>
                <td style="padding: 12px 0 12px 12px;">
                  <p style="color: #111827; font-size: 14px; font-weight: bold; margin: 0 0 2px;">Personalizar via WhatsApp</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">Fale com nossa equipe para pedidos especiais</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <div style="padding: 32px; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <a href="https://bravosbrasil.com.br" style="display: inline-block; background: #00843D; color: #FFCC29; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; padding: 16px 40px; border-radius: 50px;">
              ACESSAR MINHA CONTA →
            </a>
          </div>

          <!-- Footer -->
          <div style="background: #111827; padding: 24px 32px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #FFCC29; font-size: 16px; font-weight: bold; letter-spacing: 3px; margin: 0 0 8px;">BRAVOS BRASIL</p>
            <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; line-height: 1.6;">
              Dúvidas? Fale conosco pelo WhatsApp<br>
              Este é um e-mail automático, não é necessário responder.
            </p>
          </div>

        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar e-mail de boas-vindas:', err);
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
