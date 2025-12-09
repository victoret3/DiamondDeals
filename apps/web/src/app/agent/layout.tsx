import { AgentNavbar } from "@/components/agent/navbar";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AgentNavbar />
      {children}
    </div>
  );
}
