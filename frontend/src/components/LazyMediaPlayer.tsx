import React, { useState, useRef, useEffect } from 'react';
import MediaPlayer from './MediaPlayer';
import { API_BASE_URL } from '../config';

interface LazyMediaPlayerProps {
    maCauHoi?: string;
    maCauTraLoi?: string;
    showFileName?: boolean;
    threshold?: number; // Distance from viewport to start loading
    isPreviewMode?: boolean; // Don't load media in preview mode
}

interface MediaFile {
    id: string;
    cdnUrl?: string;
    spacesUrl?: string;
    fileName: string;
    originalName?: string;
    mimeType: string;
    fileType: number; // 1: audio, 2: image, 4: video
}

const LazyMediaPlayer: React.FC<LazyMediaPlayerProps> = ({
    maCauHoi,
    maCauTraLoi,
    showFileName = false,
    threshold = 200,
    isPreviewMode = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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

    // Fetch media files when component becomes visible (but not in preview mode)
    useEffect(() => {
        if (isVisible && (maCauHoi || maCauTraLoi) && !isLoading && !isPreviewMode) {
            fetchMediaFiles();
        }
    }, [isVisible, maCauHoi, maCauTraLoi, isPreviewMode]);

    const fetchMediaFiles = async () => {
        if (!maCauHoi && !maCauTraLoi) return;

        setIsLoading(true);
        try {
            const endpoint = maCauHoi
                ? `/files/question/${maCauHoi}`
                : `/files/answer/${maCauTraLoi}`;

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                const files = await response.json();
                // Filter only media files (audio, video)
                const mediaFiles = files.filter((file: any) =>
                    file.LoaiFile === 1 || file.LoaiFile === 4 // 1: audio, 4: video
                ).map((file: any) => ({
                    id: file.MaFile,
                    cdnUrl: file.DuongDanCDN,
                    spacesUrl: file.DuongDanSpaces,
                    fileName: file.TenFile,
                    originalName: file.TenFileGoc,
                    mimeType: file.LoaiMIME || 'application/octet-stream',
                    fileType: file.LoaiFile
                }));

                setMediaFiles(mediaFiles);
            } else {
                // If API call fails (e.g., question not in database yet), just set empty array
                setMediaFiles([]);
            }
        } catch (error) {
            console.error('Error fetching media files:', error);
            // In preview mode, questions might not be in database yet, so this is expected
            setMediaFiles([]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMediaFiles = () => {
        // In preview mode, don't render anything
        if (isPreviewMode) {
            return null;
        }

        // Don't show loading in preview mode - just return null if no files
        if (mediaFiles.length === 0) {
            return null; // Don't show anything if no media files
        }

        return (
            <div className="space-y-2">
                {mediaFiles.map((file) => (
                    <MediaPlayer
                        key={file.id}
                        file={file}
                        type={file.fileType === 1 ? 'audio' : 'video'}
                    />
                ))}
            </div>
        );
    };

    return (
        <div ref={elementRef} className="lazy-media-player">
            {isVisible && renderMediaFiles()}
        </div>
    );
};

export default LazyMediaPlayer;
