import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    animationClass = 'fade-in',
    delay = 0
  } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!triggerOnce || !hasAnimated) {
              setTimeout(() => {
                setIsVisible(true);
                setHasAnimated(true);
                element.classList.add(animationClass);
              }, delay);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
            element.classList.remove(animationClass);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, animationClass, delay, hasAnimated]);

  return { elementRef, isVisible };
};

export const useParallax = (speed = 0.5) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrolled;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;

      const scrollPercentage = Math.max(
        0,
        Math.min(1, (scrolled + windowHeight - elementTop) / (windowHeight + elementHeight))
      );

      const translateY = (scrollPercentage - 0.5) * speed * 100;
      element.style.transform = `translateY(${translateY}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return elementRef;
};

export const useStaggeredAnimation = (items, delay = 100) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);

            const children = Array.from(container.children);
            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('fade-in');
              }, index * delay);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [delay, isVisible]);

  return { containerRef, isVisible };
};