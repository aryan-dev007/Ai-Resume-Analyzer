const puppeteer = require("puppeteer");

/**
 * Converts an HTML string into a PDF Buffer using Puppeteer.
 * @param {string} htmlContent - The full HTML markup (with inline CSS/styles).
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
async function generatePdfFromHtml(htmlContent) {
    let browser = null;
    try {
        console.log("🚀 Launching Puppeteer browser instance...");
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ],
        });

        const page = await browser.newPage();

        // Set viewport to standard A4 proportions for accurate rendering
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

        console.log("📄 Setting page HTML content...");
        await page.setContent(htmlContent, {
            waitUntil: ["load", "networkidle0"],
            timeout: 30000,
        });

        console.log("🖨️ Generating PDF binary stream...");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "12mm",
                right: "12mm",
                bottom: "12mm",
                left: "12mm",
            },
        });

        console.log(`✅ PDF successfully generated. Size: ${pdfBuffer.length} bytes.`);
        return pdfBuffer;
    } catch (error) {
        console.error("❌ Puppeteer PDF Generation Error:", error);
        throw new Error(`Failed to generate PDF from HTML: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
            console.log("🔒 Puppeteer browser instance closed.");
        }
    }
}

module.exports = {
    generatePdfFromHtml,
};
