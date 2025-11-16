import { NextResponse } from "next/server";
import crypto from "crypto";
import { ConfigurationError, ExamBankError } from "../../errors";
import { requireStudentAuthentication, withErrorHandling } from "../../utils";

/**
 * Returns an exam found at the provided route
 */
export async function GET(
  _: Request,
  context: RouteContext<"/api/exams/[name]">,
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const session = await requireStudentAuthentication();

    const { params } = context;
    const name = (await params).name;

    const payload = { k: name, uid: session?.user?.id, type: "get-exam" };
    const url = getExamBankWorkerURL(name, payload);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`Exam bank threw an error: ${await res.text()}`);
      throw new ExamBankError();
    }

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  });
}

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const getSigningSecret = (): string => {
  const signingSecret = process.env.EXAM_BANK_WORKER_SIGNING_SECRET;
  if (!signingSecret) {
    throw new ConfigurationError("Missing secret");
  }
  return signingSecret;
};

const encodeMessage = (payload: object) => {
  const msg = Buffer.from(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", Buffer.from(getSigningSecret()))
    .update(msg)
    .digest();

  return `${bytesToHex(msg)},${bytesToHex(sig)}`;
};

const getExamBankWorkerURL = (examName: string, payload: object): URL => {
  const token = encodeMessage(payload);

  const url = new URL(`${process.env.EXAM_BANK_WORKER_HOSTNAME}/${examName}`);
  url.searchParams.set("t", token);

  return url;
};
