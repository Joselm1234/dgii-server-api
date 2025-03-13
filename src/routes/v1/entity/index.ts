import { FastifyPluginAsync } from "fastify";
import { getDB } from "../../../db/database";

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/:id", async function (request, reply) {
    const { id } = request.params as any;
    const db = getDB();
    const collection = db.collection("entities");

    try {
      const result = await collection.findOne({ rnc: id });

      if (!result) {
        return reply.status(404).send({ error: "Not found" });
      }

      return result;
    } catch (error) {
      console.error("Error:", error);
      return reply.status(500).send({ error: "Internal server error" }); // Manejo de errores
    }
  });
};

export default example;
