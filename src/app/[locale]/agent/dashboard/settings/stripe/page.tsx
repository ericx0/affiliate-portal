import { permanentRedirect } from "next/navigation";

export default function AgentStripeRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  permanentRedirect(`https://agent.linkchinamed.com/${locale}/dashboard/settings/stripe`);
}