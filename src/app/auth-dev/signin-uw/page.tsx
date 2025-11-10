import { Metadata } from "next";
import { protectToStudents } from "../../auth.actions";

export const metadata: Metadata = { title: "Protected page" };

export default async function ProtectedPage() {
  await protectToStudents("/auth-dev/signin-uw");

  return "this page requires a minimum of UW auth";
}
