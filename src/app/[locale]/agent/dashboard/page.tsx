import { permanentRedirect } from "next/navigation";

export default function AgentDashboardRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  permanentRedirect(`https://agent.linkchinamed.com/${locale}/dashboard`);
}