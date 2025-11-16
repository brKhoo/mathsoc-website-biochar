import { NextResponse } from "next/server";
import { requireStudentAuthentication, withErrorHandling } from "../../utils";
import { fetchFromExamBankWorker } from "../../exam-bank-worker";
import { isAuthEnabled } from "@/app/auth.actions";
import { UnauthorizedError } from "../../errors";

/**
 * Returns an exam found at the provided route
 *
 * @todo delete this
 */
export async function GET(): Promise<NextResponse> {
  return withErrorHandling(async () => {
    // this is a dev-only endpoint
    if (await isAuthEnabled()) {
      throw new UnauthorizedError();
    }

    const session = await requireStudentAuthentication();

    const res = await fetchFromExamBankWorker({
      method: "regenerate-list",
      uid: session?.user?.id,
    });

    return new NextResponse(res.body, {
      status: 200,
    });
  });
}
