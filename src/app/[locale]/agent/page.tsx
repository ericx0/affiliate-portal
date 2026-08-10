import { permanentRedirect } from "next/navigation";

export default function AgentIndexRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  permanentRedirect(`https://agent.linkchinamed.com/${locale}/dashboard`);
}