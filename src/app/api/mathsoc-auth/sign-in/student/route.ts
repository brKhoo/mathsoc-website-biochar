import { NextRequest } from "next/server";
import { signInFromRequest } from "../util";

export async function GET(request: NextRequest) {
  signInFromRequest(request, "uw-adfs");
}
