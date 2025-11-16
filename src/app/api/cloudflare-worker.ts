import { ConfigurationError, ExamBankError } from "./errors";
import crypto from "crypto";

export const fetchFromWorker = async (
  relativePath: string,
  payload: object,
): Promise<Response> => {
  const url = getExamBankWorkerURL(relativePath, payload);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`Exam bank threw an error: ${await res.text()}`);
    throw new ExamBankError();
  }

  return res;
};

const getExamBankWorkerURL = (path: string, payload: object): URL => {
  const token = encodeMessage(payload);

  const url = new URL(`${process.env.EXAM_BANK_WORKER_HOSTNAME}/${path}`);
  url.searchParams.set("t", token);

  return url;
};

const encodeMessage = (payload: object) => {
  const msg = Buffer.from(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", Buffer.from(getSigningSecret()))
    .update(msg)
    .digest();

  return `${bytesToHex(msg)},${bytesToHex(sig)}`;
};

const getSigningSecret = (): string => {
  const signingSecret = process.env.EXAM_BANK_WORKER_SIGNING_SECRET;
  if (!signingSecret) {
    throw new ConfigurationError("Missing secret");
  }
  return signingSecret;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
