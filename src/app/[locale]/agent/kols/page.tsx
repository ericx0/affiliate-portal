import { permanentRedirect } from "next/navigation";

export default function AgentKolsRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  permanentRedirect(`https://agent.linkchinamed.com/${locale}/kols`);
}
