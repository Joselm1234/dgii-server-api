import axios from "axios";
import JSZip from "jszip";

export async function downloadAndProcessZip(
  url: string,
  processLine: (line: string) => void
) {
  try {
    // Step 1: Download the ZIP file from the URL
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const zipData = response.data;

    // Step 2: Unzip the file
    const zip = await JSZip.loadAsync(zipData);

    const txtFile = "TMP/DGII_RNC.TXT";

    // Step 3: Read the .txt file content from the ZIP
    const fileContent = await zip.files[txtFile].async("string");

    // Step 4: Process each line of the .txt file
    const lines = fileContent.split("\n");
    await Promise.all(lines.map(processLine));

    console.log("File processed successfully!");
  } catch (error) {
    console.error("Error processing the ZIP file:", error);
  }
}
