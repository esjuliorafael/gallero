import { FastifyPluginAsync } from 'fastify';
import { 
  listEventsHandler, 
  getEventHandler, 
  createEventHandler, 
  updateEventHandler,
  purchaseTicketHandler, 
  listPendingTicketsHandler,
  approveTicketHandler 
} from './events.controller';

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // Public/User Routes
  fastify.get('/', listEventsHandler);
  fastify.get('/:id', getEventHandler);

  fastify.post('/:id/purchase', { 
    preHandler: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 minute'
      }
    }
  }, purchaseTicketHandler);

  // Admin Routes
  fastify.get('/tickets/pending', { preHandler: [fastify.requireAdmin] }, listPendingTicketsHandler);
  fastify.post('/', { preHandler: [fastify.requireAdmin] }, createEventHandler);
  fastify.patch('/:id', { preHandler: [fastify.requireAdmin] }, updateEventHandler);
  fastify.patch('/tickets/:id/approve', { preHandler: [fastify.requireAdmin] }, approveTicketHandler);
};


export default eventsRoutes;
