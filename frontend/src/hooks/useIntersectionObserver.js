// src/hooks/useIntersectionObserver.js
import { useState, useEffect } from 'react';

const useIntersectionObserver = (elementRef, { threshold = 0.1, root = null, rootMargin = '0%' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); // Stop observing once visible
                }
            },
            { threshold, root, rootMargin }
        );

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [elementRef, threshold, root, rootMargin]);

    return isVisible;
};

export default useIntersectionObserver;