import { FastifyRequest, FastifyReply } from 'fastify';
import { createEventSchema, approveTicketSchema } from './events.schemas';
import * as eventsService from './events.service';
import { storageService } from '../../lib/storage.service';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function listEventsHandler(request: FastifyRequest, reply: FastifyReply) {
  const events = await eventsService.listEvents();
  return reply.send(events);
}

export async function getEventHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const userId = (request.user as any)?.sub;
  const event = await eventsService.getEventById(request.params.id, userId);
  return reply.send(event);
}

export async function createEventHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createEventSchema.parse(request.body);
  const event = await eventsService.createEvent(body);
  return reply.code(201).send(event);
}

export async function purchaseTicketHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const data = await request.file();
  
  if (!data) {
    return reply.status(400).send({ message: 'Se requiere un comprobante de pago' });
  }

  if (!ALLOWED_MIMETYPES.includes(data.mimetype)) {
    return reply.status(400).send({ message: 'Formato no permitido. Use JPEG, PNG o WEBP.' });
  }

  const userId = (request.user as any).sub;
  const eventId = request.params.id;

  // 1. Obtener o crear ticket para tener un ID estable
  // Pasamos una URL temporal para el upsert inicial si es necesario
  const ticket = await eventsService.createTicket(userId, eventId, 'PENDING_UPLOAD');

  try {
    // 2. Convertir stream a Buffer (máximo 5MB controlado por Fastify)
    const buffer = await data.toBuffer();

    // 3. Subir a R2 usando el Ticket ID como nombre de archivo
    const publicUrl = await storageService.uploadPaymentProof(ticket.id, buffer, data.mimetype);

    // 4. Actualizar el ticket con la URL real
    const updatedTicket = await eventsService.createTicket(userId, eventId, publicUrl);

    return reply.send(updatedTicket);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: 'Error al procesar la subida del comprobante' });
  }
}

export async function approveTicketHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { status } = approveTicketSchema.parse(request.body);
  const adminId = (request.user as any).sub;
  
  const ticket = await eventsService.updateTicketStatus(request.params.id, status as any, adminId);
  return reply.send(ticket);
}
