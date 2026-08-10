import { permanentRedirect } from "next/navigation";

export default function AgentKolDetailRedirect({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  permanentRedirect(`https://agent.linkchinamed.com/${locale}/kols/${id}`);
}