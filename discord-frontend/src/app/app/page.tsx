/**
 * `/app` rotası — Next.js App Router’da `src/app` routing köküdür;
 * içteki `app` klasörü URL’yi `/app` yapar (login sonrası ana sohbet ekranı).
 * UI mantığı `components/app/AppShell` içindedir.
 */
import AppShell from "@/components/app/AppShell";

export default function AppPage() {
  return <AppShell />;
}
