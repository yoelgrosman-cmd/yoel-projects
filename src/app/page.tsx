import { redirect } from "next/navigation";

// Root redirects to store homepage
export default function RootPage() {
  redirect("/home");
}
