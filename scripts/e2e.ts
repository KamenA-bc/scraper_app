import "dotenv/config";
import { ScraperService } from "../src/lib/services/scraper.service";
import { AuditService } from "../src/lib/services/audit.service";
import { PdfService } from "../src/lib/services/pdf.service";
import { google } from "@ai-sdk/google";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const targetUrl = process.argv[2] || "https://example.com";
  console.log(`\n🚀 Starting End-to-End Test for: ${targetUrl}\n`);

  if (!process.env.FIRECRAWL_API_KEY || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ Missing required API keys in environment.");
    console.error(
      "Please copy .env.example to .env and populate FIRECRAWL_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY",
    );
    process.exit(1);
  }

  try {
    // Phase 2: Scrape
    console.log("1️⃣  Scraping target URL via Firecrawl...");
    const scraper = new ScraperService();
    const scrapeResult = await scraper.scrape(targetUrl);
    console.log(
      `✅ Scrape complete! Extracted ${scrapeResult.markdown.length} characters of markdown.`,
    );
    if (scrapeResult.wasTruncated) {
      console.log(
        `⚠️  Warning: Content was truncated from ${scrapeResult.originalLength} characters.`,
      );
    }

    // Phase 3: AI Audit
    console.log("\n2️⃣  Running Vibe & Clarity Audit via Vercel AI SDK (gemini-2.5-flash)...");
    const model = google("gemini-2.5-flash");
    const auditor = new AuditService(model);
    const auditReport = await auditor.analyze(scrapeResult);
    console.log(`✅ Audit complete!`);
    console.log(`   Overall Score: ${auditReport.overallClarityScore}/100`);
    console.log(
      `   Readability:   ${auditReport.overallReadabilityLevel.replace("_", " ")}`,
    );
    console.log(`   Jargon Found:  ${auditReport.jargon.length} terms`);
    console.log(`   Sections:      ${auditReport.sections.length}`);

    // Phase 4: PDF Generation
    console.log("\n3️⃣  Generating Headless PDF via Puppeteer...");
    const pdfService = new PdfService();
    const pdfBuffer = await pdfService.generatePdf(auditReport);

    const outputPath = path.resolve(process.cwd(), "audit-report-output.pdf");
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ PDF successfully generated and saved to: ${outputPath}`);

    console.log("\n🎉 End-to-End Test Completed Successfully!");
  } catch (error) {
    console.error("\n❌ End-to-End Test Failed!");
    console.error(error);
    process.exit(1);
  }
}

main();
