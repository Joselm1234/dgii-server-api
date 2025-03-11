import { FastifyPluginAsync } from "fastify"

import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',    // Redis server host
  port: 6379,          // Redis server port
});

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/:id', async function (request, reply) {
    const { id } = request.params as any;
    const data = await redis.get(id);
    if (!data) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return JSON.parse(data);
  })
}

export default example;
