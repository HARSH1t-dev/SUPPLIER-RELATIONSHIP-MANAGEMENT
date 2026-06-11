import React, { useEffect, useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedThemeToggler({ variant = 'circle', className = '', ...props }) {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = useCallback((event) => {
    const nextDark = !isDark;

    const changeThemeState = () => {
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      }
    };

    if (!document.startViewTransition) {
      changeThemeState();
      return;
    }

    // Determine the click position (or button center if triggered programmatically)
    let x, y;
    if (event && event.clientX !== undefined && event.clientY !== undefined) {
      x = event.clientX;
      y = event.clientY;
    } else {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
      }
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        changeThemeState();
      });
    });

    transition.ready.then(() => {
      let clipPathStart, clipPathEnd;

      if (variant === 'square') {
        const top = y;
        const left = x;
        const bottom = window.innerHeight - y;
        const right = window.innerWidth - x;
        clipPathStart = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
        clipPathEnd = `inset(0px 0px 0px 0px)`;
      } else {
        // circle variant
        const maxRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );
        clipPathStart = `circle(0px at ${x}px ${y}px)`;
        clipPathEnd = `circle(${maxRadius}px at ${x}px ${y}px)`;
      }

      document.documentElement.animate(
        {
          clipPath: [clipPathStart, clipPathEnd],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }, [isDark, variant]);

  // Framer Motion icon variants
  const sunVariants = {
    initial: { rotate: -90, scale: 0, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: 90, scale: 0, opacity: 0 },
  };

  const moonVariants = {
    initial: { rotate: 90, scale: 0, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: -90, scale: 0, opacity: 0 },
  };

  const buttonShapeClass = variant === 'square' ? 'rounded-md' : 'rounded-full';

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={`relative flex h-10 w-10 cursor-pointer items-center justify-center border border-slate-200 bg-white/80 text-slate-800 backdrop-blur-md transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 ${buttonShapeClass} ${className}`}
      aria-label="Toggle theme"
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'dark-icon' : 'light-icon'}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <motion.div variants={moonVariants} className="flex items-center justify-center">
              <Moon className="h-[1.2rem] w-[1.2rem] text-slate-200 fill-slate-200" />
            </motion.div>
          ) : (
            <motion.div variants={sunVariants} className="flex items-center justify-center">
              <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 fill-amber-500" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

export function AnimatedThemeTogglerSquareDemo() {
  return (
    <div className="flex justify-center p-6">
      <AnimatedThemeToggler variant="square" />
    </div>
  );
}
