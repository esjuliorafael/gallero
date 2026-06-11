import { prisma } from '../../lib/prisma';
import { sendWhatsAppMessage } from '../../lib/evolution.client';
import { CreateEventBody, UpdateEventBody } from './events.schemas';

export async function listEvents() {
  return prisma.liveEvent.findMany({
    orderBy: { scheduled_at: 'asc' },
    include: {
      _count: {
        select: { tickets: true }
      }
    }
  });
}

export async function getEventById(eventId: string, userId?: string) {
  const event = await prisma.liveEvent.findUnique({
    where: { id: eventId },
    include: {
      tickets: userId ? { where: { user_id: userId } } : false
    }
  });

  if (!event) throw new Error('Evento no encontrado');
  return event;
}

export async function createEvent(data: CreateEventBody) {
  return prisma.liveEvent.create({
    data: {
      ...data,
      scheduled_at: new Date(data.scheduled_at)
    }
  });
}

export async function updateEvent(eventId: string, data: UpdateEventBody) {
  return prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      ...data,
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined
    }
  });
}

export async function createTicket(userId: string, eventId: string, paymentProofUrl: string) {
  return prisma.ticket.upsert({
    where: {
      user_id_event_id: {
        user_id: userId,
        event_id: eventId
      }
    },
    update: {
      payment_proof_url: paymentProofUrl,
      status: 'WAITING_APPROVAL'
    },
    create: {
      user_id: userId,
      event_id: eventId,
      payment_proof_url: paymentProofUrl,
      status: 'WAITING_APPROVAL'
    }
  });
}

export async function listPendingTickets() {
  return prisma.ticket.findMany({
    where: { status: 'WAITING_APPROVAL' },
    include: {
      user: {
        select: {
          full_name: true,
          phone: true
        }
      },
      event: {
        select: {
          title: true,
          scheduled_at: true
        }
      }
    },
    orderBy: { created_at: 'asc' }
  });
}

export async function updateTicketStatus(ticketId: string, status: 'APPROVED' | 'REJECTED', adminId: string) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      approved_at: status === 'APPROVED' ? new Date() : null,
      approved_by: adminId
    },
    include: {
      user: {
        select: {
          full_name: true,
          phone: true
        }
      },
      event: {
        select: {
          id: true,
          title: true,
          scheduled_at: true
        }
      }
    }
  });

  if (status === 'APPROVED' && ticket.user.phone) {
    // Formatear fecha para el mensaje
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    }).format(ticket.event.scheduled_at);

    const appUrl = process.env.APP_URL || 'https://gallero.com'; // Ajustar según el dominio real
    
    // Copywriting Transaccional
    const message = `🎟️ *¡Pago Confirmado!*

Hola ${ticket.user.full_name || 'Gallero'}, hemos validado tu transferencia exitosamente.

Ya tienes acceso oficial a la ponencia en vivo:
🎙️ *${ticket.event.title}*
📅 Fecha: ${formattedDate}

Tu enlace directo al evento:
🔗 ${appUrl}/live/${ticket.event.id}

Guarda este mensaje. El día del evento solo debes hacer clic en el enlace para entrar directamente a la transmisión.`;
    
    // Envío No Bloqueante (Tolerancia a fallos)
    try {
      await sendWhatsAppMessage(ticket.user.phone, message);
    } catch (error) {
      // Si el WhatsApp falla, solo lo logueamos. El ticket ya está aprobado en DB.
      console.error(`[WhatsApp Error] No se pudo enviar confirmación al ticket ${ticketId}:`, error);
    }
  }

  return ticket;
}
