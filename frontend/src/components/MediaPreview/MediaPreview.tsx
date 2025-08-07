import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  ExternalLink,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X
} from 'lucide-react';
import { MediaReference, MediaType } from '../../types/question-parser.types';

interface MediaPreviewProps {
  media: MediaReference;
  onLoad?: () => void;
  onError?: (error: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  showControls?: boolean;
  className?: string;
}

interface AudioPlayerProps {
  src: string;
  fileName: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  showControls?: boolean;
}

interface ImageViewerProps {
  src: string;
  fileName: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  maxWidth?: number;
  maxHeight?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  fileName,
  onLoad,
  onError,
  showControls = true
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      if (onLoad) onLoad();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = () => {
      setIsLoading(false);
      const errorMsg = 'Không thể tải file audio';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onLoad, onError]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">Lỗi audio</span>
        </div>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        <p className="text-xs text-red-600 mt-1">{fileName}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* File Info */}
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900 truncate">{fileName}</span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </div>

      {showControls && !isLoading && (
        <div className="space-y-3">
          {/* Main Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => skip(-10)}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Lùi 10 giây"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => skip(10)}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Tiến 10 giây"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1 text-gray-600 hover:text-gray-800">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Simple Controls for non-interactive mode */}
      {!showControls && !isLoading && (
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <span className="text-xs text-gray-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
};

const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  fileName,
  onLoad,
  onError,
  maxWidth = 400,
  maxHeight = 300
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleImageLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setIsLoading(false);
    const errorMsg = 'Không thể tải hình ảnh';
    setError(errorMsg);
    if (onError) onError(errorMsg);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">Lỗi hình ảnh</span>
        </div>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        <p className="text-xs text-red-600 mt-1">{fileName}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        {/* Image Info */}
        <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900 truncate">{fileName}</span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          </div>

          {!isLoading && !error && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Phóng to"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={handleRotate}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Xoay"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Xem toàn màn hình"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Image Container */}
        <div
          className="flex items-center justify-center p-4 bg-gray-100"
          style={{ minHeight: '200px' }}
        >
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Đang tải hình ảnh...</p>
            </div>
          ) : (
            <img
              src={src}
              alt={fileName}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                maxWidth: `${maxWidth}px`,
                maxHeight: `${maxHeight}px`,
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease'
              }}
              className="rounded shadow-sm cursor-pointer"
              onClick={() => setIsFullscreen(true)}
            />
          )}
        </div>

        {/* Zoom Info */}
        {!isLoading && !error && zoom !== 1 && (
          <div className="px-3 py-2 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
              <button
                onClick={handleResetView}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Đặt lại
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={src}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  onLoad,
  onError,
  maxWidth = 400,
  maxHeight = 300,
  showControls = true,
  className = ''
}) => {
  const mediaUrl = media.uploadedUrl || media.originalPath;
  const fileName = media.fileName || "file";

  if (!mediaUrl) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">Thiếu URL media</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">Không tìm thấy đường dẫn file: {fileName}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {media.type === MediaType.AUDIO ? (
        <AudioPlayer
          src={mediaUrl}
          fileName={fileName}
          onLoad={onLoad}
          onError={onError}
          showControls={showControls}
        />
      ) : media.type === MediaType.IMAGE ? (
        <ImageViewer
          src={mediaUrl}
          fileName={fileName}
          onLoad={onLoad}
          onError={onError}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
        />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Loại media không hỗ trợ</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{fileName}</p>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
