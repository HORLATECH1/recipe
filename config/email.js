const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

async function sendVerificationCode(email, code) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    throw new Error('Brevo email settings are missing');
  }

  return brevo.transactionalEmails.sendTransacEmail({
    subject: 'Verify your Pantry Notes account',
    textContent: `Your Pantry Notes verification code is ${code}. It expires in 10 minutes.`,
    sender: {
      name: process.env.BREVO_SENDER_NAME || 'Pantry Notes',
      email: process.env.BREVO_SENDER_EMAIL
    },
    to: [{ email }]
  });
}

module.exports = { sendVerificationCode };