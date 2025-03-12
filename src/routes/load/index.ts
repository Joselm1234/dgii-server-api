import { FastifyPluginAsync } from "fastify";
import { getDB } from "../../db/database";
import { downloadAndProcessZip } from "../../utils";

const BATCH_SIZE = 10000;
const ZIP_URL =
  process.env.ZIP_URL ||
  "https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip";

const rncRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const startTime = Date.now();
    let batch: any[] = [];
    const db = getDB();
    const collection = db.collection("entities");

    try {
      try {
        await collection.drop();
        console.log("Collection 'entities' delete.");
      } catch (dropError) {
        console.warn("Error:", dropError);
      }

      await downloadAndProcessZip(ZIP_URL, async (line: string) => {
        if (countSeparators(line, "|") < 10) {
          console.warn("Skipping invalid line:", line);
          return;
        }

        const parts = line.split("|");

        const [
          rnc,
          name,
          commercialName,
          activity,
          ,
          ,
          ,
          ,
          foundationDate,
          status,
          regime,
        ] = parts;

        const parsedData = {
          rnc,
          name,
          commercialName,
          foundationDate,
          activity,
          status,
          regime: regime ? regime.replace("\r", "") : null,
        };

        batch.push({ insertOne: { document: parsedData } });

        if (batch.length >= BATCH_SIZE) {
          try {
            await collection.bulkWrite(batch);
            console.log(`Batch inserted with ${batch.length} documents`);
            batch = [];
          } catch (error) {
            console.error("Error inserting batch:", error);
          }
        }
      });

      if (batch.length > 0) {
        await collection.bulkWrite(batch);
        console.log(`Final batch inserted with ${batch.length} documents`);
      }

      await collection.createIndex({ rnc: 1 });
      console.log("Índice 'rnc' create.");

      const endTime = Date.now();
      const took = endTime - startTime;

      return { status: "ok", took: `${took}ms` };
    } catch (error) {
      console.error("Error processing RNC data:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
};

function countSeparators(line: string, separator: string): number {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === separator) {
      count++;
    }
  }
  return count;
}

export default rncRoute;
