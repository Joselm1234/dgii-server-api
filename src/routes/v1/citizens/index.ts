import { FastifyInstance } from "fastify";
import puppeteer from "puppeteer";

export default async function (fastify: FastifyInstance) {
  fastify.get("/:id", async function (request, reply) {
    const { id } = request.params as { id: string };

    // Validate ID (must be numeric)
    if (!id || !/^\d+$/.test(id)) {
      return reply.status(400).send({
        error: "Citizen ID is required and must be numeric.",
      });
    }

    let browser;
    try {
      // Launch Puppeteer with optimized settings
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      });
      const page = await browser.newPage();

      // Navigate to the target page
      await page.goto(
        "https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/ciudadanos.aspx",
        { waitUntil: "domcontentloaded" } // Faster loading strategy
      );

      // Interact with the form
      await page.type("#cphMain_txtCedula", id);
      await Promise.all([
        page.click("#cphMain_btnBuscarCedula"),
        page.waitForSelector("#cphMain_divResultsContainer table", {
          timeout: 1000,
        }), // Reduced timeout
      ]);

      // Extract data from the results table
      const data = await page.evaluate(() => {
        const resultsTable = document.querySelector(
          "#cphMain_divResultsContainer table"
        );
        if (!resultsTable) return null;

        const rows = Array.from(resultsTable.querySelectorAll("tr"));
        const result: Record<string, string> = {};

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length === 2) {
            const label = cells[0].textContent?.trim() || "Unknown";
            const value = cells[1].textContent?.trim() || "";
            result[label] = value;
          }
        });

        return result;
      });
      // Mapping from Spanish to English
      const labelMapping: Record<string, string> = {
        Nombre: "name",
        Estado: "status",
        Tipo: "type",
        "RNC o Cédula": "rnc_or_id",
        Marca: "category",
        // Add more mappings as necessary
      };
      if (!data) {
        return reply
          .status(404)
          .send({ error: "No results found for the provided ID." });
      }

      // Translate keys in the extracted data
      const translatedData: Record<string, string> = {};
      for (const [spanishKey, value] of Object.entries(data)) {
        const englishKey = labelMapping[spanishKey] || spanishKey; // Fallback to Spanish key if no mapping exists
        translatedData[englishKey] = value;
      }

      // Send extracted data as response
      return reply.send(translatedData);
    } catch (error) {
      console.error("Scraping error:", error);
      return reply.status(500).send({
        error: "An error occurred while retrieving citizen data.",
        details: error,
      });
    } finally {
      // Ensure browser is closed
      if (browser) {
        await browser.close();
      }
    }
  });
}
