import {
  LayoutDashboard,
  Radar,
  Swords,
  BarChart3,
  BookOpen,
  ShieldAlert,
} from "lucide-react";

export type PageId =
  | "overview"
  | "simulation"
  | "gametheory"
  | "analytics"
  | "methodology";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "simulation", label: "Live Simulation", icon: <Radar size={16} /> },
  { id: "gametheory", label: "Game Theory", icon: <Swords size={16} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { id: "methodology", label: "Methodology", icon: <BookOpen size={16} /> },
];

interface Props {
  page: PageId;
  onChange: (p: PageId) => void;
}

export default function Navbar({ page, onChange }: Props) {
  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 pt-4">
      <nav className="max-w-7xl mx-auto glass-strong rounded-2xl px-3 sm:px-5 py-3 flex items-center justify-between gap-4 animate-fade-up">
        {/* Brand */}
        <button
          onClick={() => onChange("overview")}
          className="flex items-center gap-3 shrink-0 group"
        >
          <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] shadow-lg">
            <ShieldAlert size={18} className="text-white" />
            <span className="absolute inset-0 rounded-xl ping-ring border border-[var(--accent)] opacity-40" />
          </span>
          <span className="hidden sm:flex flex-col leading-tight text-left">
            <span className="font-bold tracking-tight text-gradient">
              DisasterCoord&nbsp;AI
            </span>
            <span className="text-[10px] text-[var(--muted)]">
              Multi-Agent Response
            </span>
          </span>
        </button>

        {/* Nav pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`nav-pill flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${
                page === item.id
                  ? "active text-white"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
