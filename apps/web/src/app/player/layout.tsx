import { PlayerNavbar } from "@/components/player/navbar";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PlayerNavbar />
      {children}
    </div>
  );
}
