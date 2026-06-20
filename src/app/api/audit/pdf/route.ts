import { NextResponse } from "next/server";
import {
  AuditReportSchema,
  createApiError,
  ErrorCode,
  type ApiError,
} from "@/lib/schemas";
import { PdfService } from "@/lib/services/pdf.service";

/**
 * Type guard for ApiError
 */
function isApiError(obj: unknown): obj is ApiError {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "code" in obj &&
    "message" in obj &&
    "timestamp" in obj
  );
}

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the incoming JSON request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createApiError(ErrorCode.VALIDATION_ERROR, "Invalid JSON payload"),
        { status: 400 },
      );
    }

    const parseResult = AuditReportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        createApiError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid Audit Report provided for PDF generation",
          parseResult.error.format(),
        ),
        { status: 400 },
      );
    }

    const auditReport = parseResult.data;

    // 2. Generate the PDF
    const pdfService = new PdfService();
    const pdfBuffer = await pdfService.generatePdf(auditReport);

    // 3. Return the PDF as a binary stream
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-${new URL(
          auditReport.targetUrl
        ).hostname}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    if (isApiError(error)) {
      let status = 500;
      if (error.code === ErrorCode.VALIDATION_ERROR) status = 400;
      
      return NextResponse.json(error, { status });
    }

    console.error("[API_PDF_ERROR] Unexpected failure:", error);
    return NextResponse.json(
      createApiError(
        ErrorCode.INTERNAL_ERROR,
        "An unexpected internal error occurred during PDF generation"
      ),
      { status: 500 },
    );
  }
}
