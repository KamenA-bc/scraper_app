import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { type AuditReport, ErrorCode, createApiError } from "@/lib/schemas";

/**
 * Escapes unsafe characters for HTML injection.
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export class PdfService {
  /**
   * Generates a PDF buffer from an AuditReport.
   * Launches a headless Puppeteer browser, injects rendered HTML, and captures it as a PDF.
   *
   * @param report The structured audit report.
   * @returns A Buffer containing the PDF data.
   * @throws ApiError if generation fails.
   */
  async generatePdf(report: AuditReport): Promise<Buffer> {
    const html = this.generateHtml(report);

    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
      const page = await browser.newPage();
      
      // We set content and wait until there are no more than 0 network connections for at least 500ms.
      // This ensures any fonts or external styles are loaded if we add them.
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "40px", right: "40px", bottom: "40px", left: "40px" },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw createApiError(
        ErrorCode.PDF_GENERATION_FAILED,
        `Failed to generate PDF: ${msg}`
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Transforms the JSON AuditReport into a styled, premium HTML document.
   */
  private generateHtml(report: AuditReport): string {
    const scoreColor = this.getScoreColor(report.overallClarityScore);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Vibe & Clarity Audit</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
          
          :root {
            --bg: #0f111a;
            --surface: #1e2130;
            --surface-hover: #262a3d;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.5);
            --border: #334155;
          }

          body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text-primary);
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(180deg, rgba(30,33,48,0.8) 0%, rgba(15,17,26,0) 100%);
          }

          .header h1 {
            font-size: 32px;
            margin: 0;
            font-weight: 700;
            letter-spacing: -0.05em;
          }

          .header p {
            color: var(--text-secondary);
            font-size: 14px;
            margin-top: 8px;
          }

          .url-highlight {
            color: var(--accent);
            text-decoration: none;
            word-break: break-all;
          }

          .score-card {
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 32px;
            margin: 40px 0;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }

          .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 8px solid ${scoreColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: 700;
            margin: 0 auto 16px auto;
            color: ${scoreColor};
            box-shadow: 0 0 20px ${scoreColor}40;
          }

          .summary {
            font-size: 18px;
            color: var(--text-secondary);
            margin: 20px 0;
            font-style: italic;
          }

          .section-title {
            font-size: 24px;
            font-weight: 600;
            border-bottom: 2px solid var(--border);
            padding-bottom: 8px;
            margin: 40px 0 20px 0;
            color: var(--text-primary);
          }

          .jargon-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
          }

          .card h4 {
            margin: 0 0 8px 0;
            color: #f87171;
          }

          .suggestion-box {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }

          .suggestion-col {
            flex: 1;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
          }

          .suggestion-col.original {
            border-left: 4px solid #f87171;
          }

          .suggestion-col.improved {
            border-left: 4px solid #34d399;
          }

          .tag {
            display: inline-block;
            background: var(--surface-hover);
            color: var(--text-secondary);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
          }

          /* Force page breaks cleanly */
          .page-break {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="container">
          
          <div class="header">
            <h1>Vibe & Clarity Audit Report</h1>
            <p>Target: <a href="${escapeHtml(report.targetUrl)}" class="url-highlight">${escapeHtml(report.targetUrl)}</a></p>
            <p>Audited on ${new Date(report.auditedAt).toLocaleString()}</p>
          </div>

          <div class="score-card">
            <div class="score-circle">${report.overallClarityScore}</div>
            <h2>Overall Readability: <span style="text-transform: capitalize;">${escapeHtml(report.overallReadabilityLevel.replace("_", " "))}</span></h2>
            <div class="summary">"${escapeHtml(report.summary)}"</div>
          </div>

          <!-- Jargon Section -->
          ${
            report.jargon.length > 0
              ? `
          <div class="page-break">
            <h3 class="section-title">Detected Jargon</h3>
            <div class="jargon-grid">
              ${report.jargon
                .map(
                  (j) => `
              <div class="card">
                <h4>${escapeHtml(j.term)} <small>(${j.occurrences}x)</small></h4>
                <p style="margin: 0; font-size: 14px; color: var(--text-secondary)">${escapeHtml(j.definition)}</p>
              </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Global Suggestions -->
          ${
            report.globalSuggestions.length > 0
              ? `
          <div class="page-break">
            <h3 class="section-title">Global Improvements</h3>
            ${report.globalSuggestions
              .map(
                (s) => `
            <div class="suggestion-box page-break">
              <div class="suggestion-col original">
                <span style="font-size:12px; color: #f87171; text-transform: uppercase; font-weight: bold;">Original</span>
                <p>${escapeHtml(s.original)}</p>
              </div>
              <div class="suggestion-col improved">
                <span style="font-size:12px; color: #34d399; text-transform: uppercase; font-weight: bold;">Improved</span>
                <p>${escapeHtml(s.improved)}</p>
                <div style="font-size: 12px; margin-top: 12px; color: var(--text-secondary);">
                  <strong>Reason:</strong> ${escapeHtml(s.reason)}
                </div>
              </div>
            </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          <!-- Sections -->
          ${report.sections
            .map(
              (section) => `
          <div class="page-break" style="margin-top: 40px;">
            <h3 class="section-title">${escapeHtml(section.sectionName)}</h3>
            <div class="tag">Score: ${section.clarityScore}</div>
            <div class="tag">Level: ${escapeHtml(section.readabilityLevel.replace("_", " "))}</div>
            
            ${
              section.issues.length > 0
                ? `
            <ul style="color: var(--text-secondary);">
              ${section.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}
            </ul>
            `
                : ""
            }

            ${section.suggestions
              .map(
                (s) => `
            <div class="suggestion-box page-break" style="margin-top: 16px;">
              <div class="suggestion-col original">
                <span style="font-size:12px; color: #f87171; text-transform: uppercase; font-weight: bold;">Original</span>
                <p>${escapeHtml(s.original)}</p>
              </div>
              <div class="suggestion-col improved">
                <span style="font-size:12px; color: #34d399; text-transform: uppercase; font-weight: bold;">Improved</span>
                <p>${escapeHtml(s.improved)}</p>
                <div style="font-size: 12px; margin-top: 12px; color: var(--text-secondary);">
                  <strong>Reason:</strong> ${escapeHtml(s.reason)}
                </div>
              </div>
            </div>
            `
              )
              .join("")}
          </div>
          `
            )
            .join("")}

        </div>
      </body>
      </html>
    `;
  }

  /**
   * Returns a hex color based on the score (0-100).
   */
  private getScoreColor(score: number): string {
    if (score >= 90) return "#34d399"; // Emerald 400
    if (score >= 70) return "#fbbf24"; // Amber 400
    return "#f87171"; // Red 400
  }
}
