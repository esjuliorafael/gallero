import { prisma } from '../../lib/prisma';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      full_name: true,
      role: true,
      created_at: true,
      wallet: {
        select: {
          balance_available: true,
          balance_frozen: true,
        }
      }
    }
  });

  if (!user) throw new Error('Usuario no encontrado');
  return user;
}

export async function updateProfile(userId: string, full_name: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { full_name },
    select: {
      id: true,
      phone: true,
      full_name: true,
      role: true,
    }
  });
}