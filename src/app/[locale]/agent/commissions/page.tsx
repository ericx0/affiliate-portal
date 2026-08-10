import { permanentRedirect } from "next/navigation";

export default function AgentCommissionsRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  permanentRedirect(`https://agent.linkchinamed.com/${locale}/commissions`);
}