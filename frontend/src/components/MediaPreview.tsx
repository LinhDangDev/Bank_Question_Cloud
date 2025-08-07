import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Eye, Download, FileText, Music, Image as ImageIcon } from 'lucide-react';
import { MediaFile } from '../services/zipPreviewService';

interface MediaPreviewProps {
  mediaFiles: MediaFile[];
  onMediaValidated?: (validFiles: MediaFile[], invalidFiles: MediaFile[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AudioPreview: React.FC<{ file: MediaFile }> = ({ file }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Không thể phát file audio này');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

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

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Music className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">{file.name}</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <audio ref={audioRef} src={file.url} preload="metadata" />

      <div className="flex items-center space-x-3 mb-3">
        <Music className="h-5 w-5 text-blue-500" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-500">
            {formatFileSize(file.size)} • {file.mimeType}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Play controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>

            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Volume controls */}
          <div className="flex items-center space-x-2">
            <button onClick={toggleMute} className="text-gray-600 hover:text-gray-800">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ImagePreview: React.FC<{ file: MediaFile }> = ({ file }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullSize, setShowFullSize] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setError('Không thể tải hình ảnh này');
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">{file.name}</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <ImageIcon className="h-5 w-5 text-green-500" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-500">
            {formatFileSize(file.size)} • {file.mimeType}
          </p>
        </div>
        <button
          onClick={() => setShowFullSize(true)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          <Eye className="h-4 w-4" />
          <span>Xem</span>
        </button>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        <img
          src={file.url}
          alt={file.name}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="w-full h-32 object-cover rounded border"
        />
      </div>

      {/* Full size modal */}
      {showFullSize && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              ×
            </button>
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const MediaPreview: React.FC<MediaPreviewProps> = ({ mediaFiles, onMediaValidated }) => {
  const [validFiles, setValidFiles] = useState<MediaFile[]>([]);
  const [invalidFiles, setInvalidFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    // Validate media files
    const valid: MediaFile[] = [];
    const invalid: MediaFile[] = [];

    mediaFiles.forEach(file => {
      // Basic validation
      if (file.type === 'audio') {
        const supportedAudioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg'];
        if (supportedAudioTypes.includes(file.mimeType)) {
          valid.push(file);
        } else {
          invalid.push(file);
        }
      } else if (file.type === 'image') {
        const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (supportedImageTypes.includes(file.mimeType)) {
          valid.push(file);
        } else {
          invalid.push(file);
        }
      }
    });

    setValidFiles(valid);
    setInvalidFiles(invalid);
    onMediaValidated?.(valid, invalid);
  }, [mediaFiles, onMediaValidated]);

  if (mediaFiles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Không có file media nào để preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Valid files */}
      {validFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Media Files ({validFiles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validFiles.map((file, index) => (
              <div key={index}>
                {file.type === 'audio' ? (
                  <AudioPreview file={file} />
                ) : (
                  <ImagePreview file={file} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invalid files */}
      {invalidFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-red-600 mb-3">
            Files không được hỗ trợ ({invalidFiles.length})
          </h3>
          <div className="space-y-2">
            {invalidFiles.map((file, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">{file.name}</p>
                    <p className="text-sm text-red-600">
                      Định dạng {file.mimeType} không được hỗ trợ
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
