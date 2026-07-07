import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/50"
      style={{ backgroundColor: isDark ? '#3a3a3c' : '#e5e5e5' }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-md transition-all duration-300 ease-out flex items-center justify-center ${
          isDark ? 'translate-x-5 bg-[#0a84ff]' : 'bg-white'
        }`}
      >
        {isDark ? (
          <Moon className="w-2.5 h-2.5 text-white" />
        ) : (
          <Sun className="w-2.5 h-2.5 text-[#ff9f0a]" />
        )}
      </div>
    </button>
  );
}
