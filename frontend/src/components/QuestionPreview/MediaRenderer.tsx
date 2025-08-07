import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import {
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Play,
  Pause,
  Download,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';

interface MediaReference {
  type: 'audio' | 'image';
  fileName: string;
  originalPath?: string;
  uploadedUrl?: string;
  spacesKey?: string;
  tempPath?: string;
}

interface MediaRendererProps {
  mediaReferences?: MediaReference[];
  content?: string;
  className?: string;
}

const MediaRenderer: React.FC<MediaRendererProps> = ({ mediaReferences = [], content = '', className = '' }) => {
  const [expandedMedia, setExpandedMedia] = useState<string[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>(content);

  // Process content for media references if provided
  useEffect(() => {
    if (content) {
      let processedHtml = content;

      // Process audio tags: [audio:filename.mp3]
      const audioPattern = /\[audio:\s*([^\]]+)\]/gi;
      processedHtml = processedHtml.replace(audioPattern, (match, fileName) => {
        return `<div class="audio-placeholder" data-filename="${fileName}">
          <span class="audio-icon">🔊</span> Audio: ${fileName}
        </div>`;
      });

      // Process image tags: [image:filename.jpg]
      const imagePattern = /\[image:\s*([^\]]+)\]/gi;
      processedHtml = processedHtml.replace(imagePattern, (match, fileName) => {
        return `<div class="image-placeholder" data-filename="${fileName}">
          <span class="image-icon">🖼️</span> Image: ${fileName}
        </div>`;
      });

      setProcessedContent(processedHtml);
    }
  }, [content]);

  // For content-only rendering
  if (content && (!mediaReferences || mediaReferences.length === 0)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: processedContent }} />;
  }

  // For media references display
  if (mediaReferences && mediaReferences.length > 0) {
    const toggleMediaExpansion = (fileName: string) => {
      setExpandedMedia(prev =>
        prev.includes(fileName)
          ? prev.filter(f => f !== fileName)
          : [...prev, fileName]
      );
    };

    const handleAudioPlay = (fileName: string) => {
      setPlayingAudio(playingAudio === fileName ? null : fileName);
    };

    const renderAudioMedia = (media: MediaReference) => {
      const isExpanded = expandedMedia.includes(media.fileName);
      const isPlaying = playingAudio === media.fileName;

      return (
        <div key={media.fileName} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Audio: {media.fileName}
              </span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                Audio File
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAudioPlay(media.fileName)}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleMediaExpansion(media.fileName)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              {media.uploadedUrl ? (
                <div className="space-y-2">
                  <audio
                    controls
                    className="w-full"
                    onPlay={() => setPlayingAudio(media.fileName)}
                    onPause={() => setPlayingAudio(null)}
                  >
                    <source src={media.uploadedUrl} type="audio/mpeg" />
                    <source src={media.uploadedUrl} type="audio/wav" />
                    <source src={media.uploadedUrl} type="audio/ogg" />
                    Trình duyệt của bạn không hỗ trợ phát audio.
                  </audio>

                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <ExternalLink className="w-3 h-3" />
                    <a
                      href={media.uploadedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Mở trong tab mới
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <p>📁 File path: {media.originalPath || media.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Audio chưa được upload lên server
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    const renderImageMedia = (media: MediaReference) => {
      const isExpanded = expandedMedia.includes(media.fileName);

      return (
        <div key={media.fileName} className="border border-green-200 rounded-lg p-3 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Hình ảnh: {media.fileName}
              </span>
              <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                Image File
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleMediaExpansion(media.fileName)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-green-200">
              {media.uploadedUrl ? (
                <div className="space-y-2">
                  <div className="bg-white p-2 rounded border">
                    <img
                      src={media.uploadedUrl}
                      alt={media.fileName}
                      className="max-w-full h-auto max-h-64 mx-auto rounded shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-center text-gray-500 text-sm py-4">
                      Không thể tải hình ảnh
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <ExternalLink className="w-3 h-3" />
                    <a
                      href={media.uploadedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Xem ảnh gốc
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <p>📁 File path: {media.originalPath || media.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Hình ảnh chưa được upload lên server
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    const audioFiles = mediaReferences.filter(m => m.type === 'audio');
    const imageFiles = mediaReferences.filter(m => m.type === 'image');

    // If we also have content, render it above the media files
    return (
      <div className={className}>
        {content && (
          <div className="mb-4" dangerouslySetInnerHTML={{ __html: processedContent }} />
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Media Files ({mediaReferences.length})
            </h4>
            <div className="flex gap-1">
              {audioFiles.length > 0 && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                  {audioFiles.length} Audio
                </Badge>
              )}
              {imageFiles.length > 0 && (
                <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                  {imageFiles.length} Image
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {audioFiles.map(renderAudioMedia)}
            {imageFiles.map(renderImageMedia)}
          </div>
        </div>
      </div>
    );
  }

  // Default case if no content or media references
  return null;
};

export default MediaRenderer;
