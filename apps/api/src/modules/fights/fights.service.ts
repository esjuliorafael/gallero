import { prisma } from '../../lib/prisma';
import { FightStatus } from '@prisma/client';
import { Redis } from 'ioredis';
import { getSettlementQueue } from '../../queues/settlement.queue';

export async function createFight(red_party_name: string, green_party_name: string) {
  return prisma.fight.create({
    data: { red_party_name, green_party_name, status: 'OPEN' }
  });
}

export async function listFights(status: FightStatus | undefined, page: number, limit: number) {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [fights, total] = await Promise.all([
    prisma.fight.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        red_party_name: true,
        green_party_name: true,
        status: true,
        created_at: true,
      }
    }),
    prisma.fight.count({ where })
  ]);

  return {
    data: fights,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  };
}

export async function getFightById(id: string) {
  const fight = await prisma.fight.findUnique({
    where: { id },
    select: {
      id: true,
      red_party_name: true,
      green_party_name: true,
      status: true,
      resolving_expires_at: true,
      created_at: true,
    }
  });

  if (!fight) throw new Error('Pelea no encontrada');
  return fight;
}

export async function resolveFight(
  fightId: string,
  result: 'RED' | 'GREEN' | 'DRAW',
  redis: Redis
) {
  const fight = await prisma.fight.findUnique({ where: { id: fightId } });
  if (!fight) throw new Error('Pelea no encontrada');
  if (fight.status !== 'OPEN' && fight.status !== 'RESOLVING') {
    throw new Error('La pelea no puede ser resuelta');
  }

  // Marcar como RESOLVING mientras el worker procesa
  await prisma.fight.update({
    where: { id: fightId },
    data:  { status: 'RESOLVING', resolving_expires_at: new Date(Date.now() + 5 * 60 * 1000) },
  });

  // Encolar el settlement
  await getSettlementQueue(redis).add('settle', { fightId, result });

  return { message: 'Resolución en proceso', fightId, result };
}