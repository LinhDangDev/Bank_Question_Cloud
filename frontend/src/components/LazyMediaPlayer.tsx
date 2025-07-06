import React, { useState, useRef, useEffect } from 'react';
import MediaPlayer from './MediaPlayer';

interface LazyMediaPlayerProps {
    maCauHoi?: string;
    maCauTraLoi?: string;
    showFileName?: boolean;
    threshold?: number; // Distance from viewport to start loading
}

const LazyMediaPlayer: React.FC<LazyMediaPlayerProps> = ({
    maCauHoi,
    maCauTraLoi,
    showFileName = false,
    threshold = 200
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: `${threshold}px`,
                threshold: 0.1
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [threshold, hasLoaded]);

    return (
        <div ref={elementRef} className="lazy-media-player">
            {isVisible && (
                <MediaPlayer
                    maCauHoi={maCauHoi}
                    maCauTraLoi={maCauTraLoi}
                    showFileName={showFileName}
                />
            )}
        </div>
    );
};

export default LazyMediaPlayer;
