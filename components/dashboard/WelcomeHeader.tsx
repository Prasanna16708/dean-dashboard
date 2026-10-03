'use client';

import { useEffect, useState } from 'react';

export default function WelcomeHeader() {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const fullText = 'Welcome back sir.';

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem('welcomeAnimated') === 'true';

    if (hasSeenAnimation) {
      setText(fullText);
      setIsTyping(false);
      return;
    }

    let index = 0;
    let cancelled = false;

    const timer = window.setInterval(() => {
      if (cancelled) return;

      index += 1;
      setText(fullText.slice(0, index));

      if (index >= fullText.length) {
        window.clearInterval(timer);
        sessionStorage.setItem('welcomeAnimated', 'true');
        setIsTyping(false);
      }
    }, 70);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="mb-10 border-b border-border-light pb-6 dark:border-border-dark">
      <h1 className="flex h-12 items-center text-4xl font-light tracking-wide">
        {text}
        {isTyping && <span className="ml-1 animate-pulse font-extralight">|</span>}
      </h1>
      <p className="mt-2 text-sm uppercase tracking-wide text-gray-500">System Overview</p>
    </div>
  );
}