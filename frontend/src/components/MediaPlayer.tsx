import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MediaPlayerProps {
  file: {
    id: string;
    cdnUrl?: string;
    spacesUrl?: string;
    fileName: string;
    originalName?: string;
    mimeType: string;
  };
  type: 'audio' | 'video';
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ file, type }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  // Handle case where file might be undefined or missing URLs
  if (!file) {
    return null;
  }

  const fileUrl = file.cdnUrl || file.spacesUrl || '';
  const fileName = file.originalName || file.fileName || 'Media file';

  // Don't render if no valid URL
  if (!fileUrl) {
    return null;
  }

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="media-player w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="text-sm font-medium">{fileName}</div>
      </CardHeader>
      <CardContent>
        {type === 'audio' ? (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={fileUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
            controls
          />
        ) : (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={fileUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full rounded"
            controls
          />
        )}

        <div className="custom-controls mt-2 hidden">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={togglePlay}
              className="p-1 h-8 w-8"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 rounded-full bg-gray-200"
              />
              <span className="text-xs">{formatTime(duration)}</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={toggleMute}
              className="p-1 h-8 w-8"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaPlayer;
