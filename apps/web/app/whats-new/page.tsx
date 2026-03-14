import { redirect } from "next/navigation";

export default function WhatsNewRedirect() {
  redirect("/releases");
}
