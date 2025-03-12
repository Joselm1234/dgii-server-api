import axios from "axios";
import JSZip from "jszip";
import readline from "readline";

export async function downloadAndProcessZip(
  url: string,
  processLine: (line: string) => Promise<void>
) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const zipData = response.data;

    const zip = await JSZip.loadAsync(zipData);
    const txtFile = "TMP/DGII_RNC.TXT";
    const file = zip.files[txtFile];

    if (!file) {
      throw new Error("TXT file not found in ZIP archive.");
    }

    const stream = file.nodeStream("nodebuffer");
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      await processLine(line);
    }

    console.log("File processed successfully!");
  } catch (error) {
    console.error("Error processing the ZIP file:", error);
    throw error;
  }
}
