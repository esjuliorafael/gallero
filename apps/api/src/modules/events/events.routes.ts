import { FastifyPluginAsync } from 'fastify';
import { 
  listEventsHandler, 
  getEventHandler, 
  createEventHandler, 
  purchaseTicketHandler, 
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

  // Admin Routes (Simplified for now, assuming role check later or specific admin middleware)
  fastify.post('/', { preHandler: [fastify.authenticate] }, createEventHandler);
  fastify.patch('/tickets/:id/approve', { preHandler: [fastify.authenticate] }, approveTicketHandler);
};

export default eventsRoutes;
