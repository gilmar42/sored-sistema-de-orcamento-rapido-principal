const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const FROM_NAME = process.env.FROM_NAME || 'SORED - Sistema de Orçamento';

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

const sendWelcomeEmail = async ({ to, companyName, tenantId, userId }) => {
  if (!transporter) {
    console.warn('Email service not configured. Skipping welcome email.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: 'Bem-vindo ao SORED - Seu Cadastro foi Concluído! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao SORED!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Olá <strong>${companyName}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Seu cadastro foi concluído com sucesso! Estamos muito felizes em tê-lo conosco.
            </p>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>Seus dados de acesso:</strong></p>
              <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;">
                <strong>Tenant ID:</strong> <code style="background: white; padding: 2px 8px; border-radius: 3px; font-family: monospace;">${tenantId}</code>
              </p>
              <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;">
                <strong>User ID:</strong> <code style="background: white; padding: 2px 8px; border-radius: 3px; font-family: monospace;">${userId}</code>
              </p>
              <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;">
                <strong>E-mail:</strong> <code style="background: white; padding: 2px 8px; border-radius: 3px; font-family: monospace;">${to}</code>
              </p>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Guarde essas informações em um local seguro. Você precisará delas para acessar o sistema.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                Acessar o SORED
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Precisa de ajuda? Entre em contato conosco respondendo este e-mail.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} SORED - Sistema de Orçamento Rápido</p>
            <p style="margin: 5px 0 0 0;">Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
};
