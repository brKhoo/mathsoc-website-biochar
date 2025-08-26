import { Metadata } from "next";
import { auth, signIn } from "../../../../auth";

export const metadata: Metadata = { title: "auth test" };

export default async function ProtectedPage() {
  const session = await auth();
  if (!session) {
    signIn("google");
  }

  return "this page requires google auth";
}
