import { redirect } from "next/navigation";

export default function AgentRootRedirect() {
  redirect("/agent/dashboard");
}