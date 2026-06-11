'use client';

import { useEffect, useRef } from 'react';

// Adds 'is-visible' to the element once it enters the viewport (fires once).
// Works on any host — no Framer Motion IntersectionObserver quirks.
export function useInView<T extends Element>(margin = '-60px') {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return ref;
}
