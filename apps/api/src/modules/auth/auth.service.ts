import { prisma } from '../../lib/prisma';
import { sendWhatsAppMessage } from '../../lib/evolution.client';

export async function requestOtp(phone: string): Promise<void> {
  await prisma.otpCode.updateMany({
    where: {
      phone,
      is_used: false,
      expires_at: { gt: new Date() }
    },
    data: { is_used: true }
  });

  const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const expires_at = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, code, is_used: false, expires_at }
  });

  const message = `Tu código de verificación para Gallero es: ${code}.\nVálido por 5 minutos. No lo compartas con nadie.`;

  await sendWhatsAppMessage(phone, message);
}
