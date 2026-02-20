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
      from: `"GEEKERIA" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: 'Bem-vindo à GEEKERIA — Seus 5 créditos estão esperando',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">

          <!-- Header -->
          <div style="background: #7C3AED; padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <p style="color: #F59E0B; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">MODA GEEK</p>
            <h1 style="color: #ffffff; font-size: 36px; margin: 0; letter-spacing: 4px; font-weight: 900;">GEEKERIA</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 12px 0 0; letter-spacing: 1px;">Seu universo na estampa</p>
          </div>

          <!-- Hero message -->
          <div style="background: #2563EB; padding: 32px; text-align: center;">
            <p style="color: #F59E0B; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">BEM-VINDO À FAMÍLIA</p>
            <h2 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Olá, ${data.name.split(' ')[0]}!</h2>
            <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 12px 0 0; line-height: 1.6;">Sua conta foi criada com sucesso.<br>Você já pode explorar toda a coleção patriótica.</p>
          </div>

          <!-- Credits badge -->
          <div style="padding: 32px; background: #f9fafb; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <div style="display: inline-block; background: #F59E0B; border-radius: 50px; padding: 16px 32px;">
              <p style="color: #2563EB; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 4px;">Presente de boas-vindas</p>
              <p style="color: #2563EB; font-size: 28px; font-weight: 900; margin: 0;">🎁 5 CRÉDITOS GRÁTIS</p>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0; line-height: 1.6;">Use seus créditos para criar estampas exclusivas<br>com Inteligência Artificial no Gerador de Estampas.</p>
          </div>

          <!-- Features -->
          <div style="padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <p style="color: #111827; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 20px;">O que você pode fazer agora</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 36px;">
                  <div style="width: 28px; height: 28px; background: #7C3AED; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px;">✦</div>
                </td>
                <td style="padding: 12px 0 12px 12px; border-bottom: 1px solid #f3f4f6;">
                  <p style="color: #111827; font-size: 14px; font-weight: bold; margin: 0 0 2px;">Explorar a Coleção Geek</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">Camisetas exclusivas com as estampas que você ama</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; width: 36px;">
                  <div style="width: 28px; height: 28px; background: #7C3AED; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px;">✦</div>
                </td>
                <td style="padding: 12px 0 12px 12px; border-bottom: 1px solid #f3f4f6;">
                  <p style="color: #111827; font-size: 14px; font-weight: bold; margin: 0 0 2px;">Criar Estampas com IA</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">Gere artes exclusivas usando seus 5 créditos</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; vertical-align: top; width: 36px;">
                  <div style="width: 28px; height: 28px; background: #7C3AED; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px;">✦</div>
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
            <a href="https://bravosbrasil.com.br" style="display: inline-block; background: #7C3AED; color: #F59E0B; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; padding: 16px 40px; border-radius: 50px;">
              ACESSAR MINHA CONTA →
            </a>
          </div>

          <!-- Footer -->
          <div style="background: #111827; padding: 24px 32px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #F59E0B; font-size: 16px; font-weight: bold; letter-spacing: 3px; margin: 0 0 8px;">GEEKERIA</p>
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
      from: `"GEEKERIA" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: 'Confirme seu e-mail — GEEKERIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #7C3AED; font-size: 24px; margin-bottom: 8px;">Confirme seu e-mail</h2>
          <p style="color: #374151; margin-bottom: 24px;">Olá, ${data.name}! Use o código abaixo para confirmar sua conta:</p>
          <div style="background: #f9fafb; border: 2px dashed #7C3AED; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: bold; color: #2563EB; letter-spacing: 8px;">${data.token}</span>
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
      from: `"GEEKERIA" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: `✅ Pedido confirmado — GEEKERIA #${data.orderId.slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #fff;">
          
          <!-- Header -->
          <div style="background: #7C3AED; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #F59E0B; font-size: 28px; margin: 0; letter-spacing: 2px;">GEEKERIA</h1>
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
              <p style="color: #2563EB; font-size: 20px; font-weight: bold; margin: 0;">#${data.orderId.slice(-6).toUpperCase()}</p>
            </div>

            <!-- Itens -->
            <h3 style="color: #7C3AED; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Itens do pedido</h3>
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
                <span style="color: #7C3AED; font-size: 14px; font-weight: bold;">Grátis</span>
              </div>`}
              ${data.couponDiscount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Cupom ${data.couponCode ?? ''}</span>
                <span style="color: #7C3AED; font-size: 14px;">− R$ ${data.couponDiscount.toFixed(2).replace('.', ',')}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                <span style="color: #111827; font-size: 16px; font-weight: bold;">Total</span>
                <span style="color: #7C3AED; font-size: 18px; font-weight: bold;">R$ ${data.total.toFixed(2).replace('.', ',')}</span>
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
              <a href="https://bravosbrasil.com.br" style="display: inline-block; background: #7C3AED; color: #F59E0B; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 50px; letter-spacing: 1px;">
                VER MINHA CONTA
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Dúvidas? Entre em contato via WhatsApp ou responda este e-mail.<br>
              GEEKERIA — Seu universo na estampa.
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

export interface OrderStatusEmailData {
  name: string;
  email: string;
  orderId: string;
  status: 'READY_FOR_MONTINK' | 'SENT_TO_MONTINK';
  externalReference: string;
}

export async function sendOrderStatusEmail(data: OrderStatusEmailData) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const statusConfig = {
    READY_FOR_MONTINK: {
      emoji: '⚙️',
      label: 'Em Preparação',
      message: 'Seu pedido foi confirmado e já está sendo preparado pela nossa equipe.',
      detail: 'Em breve você receberá uma nova notificação quando seu pedido for enviado.',
      color: '#2563EB',
    },
    SENT_TO_MONTINK: {
      emoji: '🚚',
      label: 'Enviado para Produção',
      message: 'Seu pedido foi enviado para produção e está a caminho!',
      detail: 'Acompanhe o status do seu pedido pelo link abaixo.',
      color: '#7C3AED',
    },
  };

  const config = statusConfig[data.status];

  try {
    await transporter.sendMail({
      from: `"GEEKERIA" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: `${config.emoji} Pedido ${config.label} — GEEKERIA #${data.externalReference.slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
          
          <!-- Header -->
          <div style="background: #7C3AED; padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <p style="color: #F59E0B; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">ATUALIZAÇÃO DO PEDIDO</p>
            <h1 style="color: #ffffff; font-size: 32px; margin: 0; letter-spacing: 4px; font-weight: 900;">GEEKERIA</h1>
          </div>

          <!-- Status banner -->
          <div style="background: ${config.color}; padding: 24px 32px; text-align: center;">
            <p style="font-size: 32px; margin: 0 0 8px;">${config.emoji}</p>
            <h2 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">${config.label}</h2>
          </div>

          <!-- Body -->
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Olá, <strong>${data.name.split(' ')[0]}</strong>!</p>
            <p style="color: #374151; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">${config.message}</p>

            <!-- Número do pedido -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Número do pedido</p>
              <p style="color: #2563EB; font-size: 20px; font-weight: bold; margin: 0;">#${data.externalReference.slice(-6).toUpperCase()}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">${config.detail}</p>

            <!-- CTA -->
            <div style="text-align: center;">
              <a href="https://bravosbrasil.com.br/order?ref=${encodeURIComponent(data.externalReference)}" style="display: inline-block; background: #7C3AED; color: #F59E0B; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; padding: 16px 40px; border-radius: 50px;">
                ACOMPANHAR PEDIDO →
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Dúvidas? Entre em contato via WhatsApp.<br>
              GEEKERIA — Seu universo na estampa.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email de status do pedido:', err);
  }
}

// ==================== WELCOME COUPON EMAIL (Newsletter) ====================

export async function sendWelcomeCouponEmail(email: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  try {
    await transporter.sendMail({
      from: `"GEEKERIA" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎁 Seu cupom de 10% OFF está aqui — GEEKERIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
          <div style="background: #7C3AED; padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <p style="color: #F59E0B; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">PRESENTE EXCLUSIVO</p>
            <h1 style="color: #ffffff; font-size: 32px; margin: 0; letter-spacing: 4px; font-weight: 900;">GEEKERIA</h1>
          </div>
          <div style="background: #2563EB; padding: 28px 32px; text-align: center;">
            <p style="font-size: 48px; margin: 0 0 8px;">🎁</p>
            <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 4px; font-weight: 700;">Seu desconto está esperando!</h2>
            <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 0;">Use na sua primeira compra</p>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: #f9fafb; border: 2px dashed #7C3AED; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Seu cupom exclusivo</p>
              <p style="color: #7C3AED; font-size: 36px; font-weight: 900; letter-spacing: 6px; margin: 0 0 8px;">BEMVINDO10</p>
              <p style="color: #2563EB; font-size: 20px; font-weight: bold; margin: 0;">10% OFF na primeira compra</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 24px;">
              ⚠️ Cupom válido para uma única utilização.<br>
              <strong>Não acumulável</strong> com outras promoções ou cupons.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://bravosbrasil.com.br/catalogo" style="display: inline-block; background: #7C3AED; color: #F59E0B; text-decoration: none; font-size: 15px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; padding: 18px 40px; border-radius: 50px;">
                USAR MEU DESCONTO →
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">GEEKERIA — Seu universo na estampa.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email de cupom:', err);
  }
}

// ==================== ABANDONED CART EMAIL ====================

export interface AbandonedCartEmailData {
  name: string;
  email: string;
  orderId: string;
  externalReference: string;
  items: { name: string; color: string; size: string; quantity: number; unitPrice: number }[];
  total: number;
}

export async function sendAbandonedCartEmail(data: AbandonedCartEmailData) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #111827; font-weight: bold; margin: 0 0 2px;">${item.name}</p>
        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #6b7280; margin: 0;">${[item.size, item.color].filter(Boolean).join(' · ')}</p>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: center; font-family: Arial, sans-serif; font-size: 14px; color: #374151;">${item.quantity}x</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-family: Arial, sans-serif; font-size: 14px; color: #374151;">R$ ${(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}</td>
    </tr>
  `).join('');

  try {
    await transporter.sendMail({
      from: `"GEEKERIA" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: `🛒 Você esqueceu algo — GEEKERIA`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">

          <!-- Header -->
          <div style="background: #7C3AED; padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <p style="color: #F59E0B; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; font-weight: bold;">SEU CARRINHO ESTÁ ESPERANDO</p>
            <h1 style="color: #ffffff; font-size: 32px; margin: 0; letter-spacing: 4px; font-weight: 900;">GEEKERIA</h1>
          </div>

          <!-- Hero -->
          <div style="background: #2563EB; padding: 28px 32px; text-align: center;">
            <p style="font-size: 40px; margin: 0 0 8px;">🛒</p>
            <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 8px; font-weight: 700;">Olá, ${data.name.split(' ')[0]}!</h2>
            <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 0; line-height: 1.6;">Você deixou itens no carrinho.<br>Eles ainda estão reservados para você!</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

            <!-- Itens -->
            <h3 style="color: #7C3AED; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Itens no seu carrinho</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              ${itemsHtml}
            </table>

            <!-- Total -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%;"><tr>
                <td style="font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; color: #111827;">Total</td>
                <td style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #7C3AED; text-align: right;">R$ ${data.total.toFixed(2).replace('.', ',')}</td>
              </tr></table>
            </div>

            <!-- Urgência -->
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
              <p style="font-family: Arial, sans-serif; font-size: 13px; color: #92400e; margin: 0;">⏳ Seu pedido será cancelado automaticamente em <strong>24 horas</strong> se não for finalizado.</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://bravosbrasil.com.br/order?ref=${encodeURIComponent(data.externalReference)}" style="display: inline-block; background: #7C3AED; color: #F59E0B; text-decoration: none; font-size: 15px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; padding: 18px 40px; border-radius: 50px;">
                FINALIZAR MINHA COMPRA →
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Dúvidas? Fale conosco via WhatsApp.<br>
              GEEKERIA — Seu universo na estampa.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email de carrinho abandonado:', err);
  }
}
