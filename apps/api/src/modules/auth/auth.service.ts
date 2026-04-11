import { prisma } from '../../lib/prisma';
import { sendWhatsAppMessage } from '../../lib/evolution.client';
import jwt from 'jsonwebtoken';

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

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ token: string; isNewUser: boolean }> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      is_used: false,
      expires_at: { gt: new Date() }
    },
    orderBy: { created_at: 'desc' }
  });

  if (!otpRecord) {
    throw new Error("OTP inválido o expirado");
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { is_used: true }
  });

  let user = await prisma.user.findFirst({ where: { phone } });
  let isNewUser = false;

  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone,
          full_name: '',
          password_hash: '',
          role: 'BETTOR'
        }
      });
      await tx.wallet.create({
        data: {
          user_id: newUser.id,
          balance_available: 0,
          balance_frozen: 0
        }
      });
      return newUser;
    });
    isNewUser = true;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const token = jwt.sign(
    { sub: user.id, phone: user.phone, role: user.role },
    secret,
    { expiresIn: '30d' }
  );

  return { token, isNewUser };
}
