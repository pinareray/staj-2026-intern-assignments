import ServerSidebar from "@/components/ServerSidebar";
import ChannelSidebar from "@/components/ChannelSidebar";
import ChatArea from "@/components/ChatArea";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden bg-background text-on-surface">
      <ServerSidebar />
      <ChannelSidebar />
      <ChatArea />
    </main>
  );
}
