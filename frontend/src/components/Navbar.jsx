import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import logoImg from "@/assets/hire-help-logo.png"; 

const links = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/about", label: "About" },
  { to: "/app", label: "App" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-nav sticky top-0 z-50" data-testid="site-navbar">
      {/* Increased height metric from h-11 to h-14 (56px) for premium breathing room */}
      <div className="max-w-[1080px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 text-[16px] font-semibold tracking-tight text-neutral-900 dark:text-white"
          data-testid="nav-logo"
        >
          {/* Logo container wrapper ensures custom backgrounds never clip awkwardly */}
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-sm border border-black/5">
            <img 
              src={logoImg} 
              alt="Hire Help Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <span>Hire Help</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `px-3 py-1.5 text-[13px] rounded-full transition-colors ${
                  isActive
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-testid="theme-toggle"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-900/5 dark:hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-900/5 dark:hover:bg-white/10"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/5 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
          <div className="max-w-[1080px] mx-auto px-6 py-2 flex flex-col">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `py-3 text-[15px] ${
                    isActive
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}