import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (localStorage.theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
      if (!('theme' in localStorage)) {
        localStorage.theme = 'light';
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={toggleTheme}
        className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors duration-300 focus:outline-none border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm overflow-hidden"
        aria-label="Toggle Theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isDark ? 'dark-icon' : 'light-icon'}
            initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 24 }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Moon className="w-5 h-5 text-white fill-white" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500 fill-amber-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}
