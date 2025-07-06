import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert, Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, FileImageOutlined, SoundOutlined } from '@ant-design/icons';

interface FileData {
    MaFile: string;
    TenFile: string;
    LoaiFile: number;
    SpacesKey: string;
    PublicUrl: string;
    CDNUrl: string;
    ResolvedUrl: string;
    UrlType: 'CDN' | 'PUBLIC' | 'LEGACY';
}

interface MediaPlayerProps {
    maFile?: string;
    maCauHoi?: string;
    maCauTraLoi?: string;
    showFileName?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
    maFile,
    maCauHoi,
    maCauTraLoi,
    showFileName = true
}) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usingFallbackUrls, setUsingFallbackUrls] = useState(false);

    useEffect(() => {
        loadFiles();
    }, [maFile, maCauHoi, maCauTraLoi]);

    const loadFiles = async (useFallback = false) => {
        if (!maFile && !maCauHoi && !maCauTraLoi) return;

        setLoading(true);
        setError(null);

        try {
            let url = '';
            if (maFile) {
                url = `/api/files-url/${maFile}`;
            } else if (maCauHoi) {
                url = `/api/files-url/question/${maCauHoi}`;
            } else if (maCauTraLoi) {
                url = `/api/files-url/answer/${maCauTraLoi}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    // No files found - this is normal, not an error
                    setFiles([]);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Đọc response text trước để xử lý các trường hợp đặc biệt
            const responseText = await response.text();

            // Nếu response rỗng, nghĩa là không có file
            if (!responseText.trim()) {
                setFiles([]);
                return;
            }

            // Thử parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', responseText);

                // Kiểm tra content type để đưa ra thông báo lỗi phù hợp
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    // Có thể là HTML error page hoặc server error
                    throw new Error('Server returned non-JSON response. Check if API server is running correctly.');
                } else {
                    throw new Error('Invalid JSON response from server');
                }
            }

            // Kiểm tra nếu data là mảng rỗng hoặc null
            if (!data || (Array.isArray(data) && data.length === 0)) {
                setFiles([]);
                return;
            }

            // Nếu single file, wrap trong array
            let fileList = Array.isArray(data) ? data : [data];

            // Thêm direct CDN URLs nếu đang sử dụng fallback
            if (useFallback) {
                fileList = fileList.map(file => ({
                    ...file,
                    ResolvedUrl: buildDirectCdnUrl(file.TenFile, file.LoaiFile),
                    UrlType: 'DIRECT_CDN' as any
                }));
                setUsingFallbackUrls(true);
            }

            setFiles(fileList);

        } catch (err) {
            console.error('Error loading files:', err);

            // Nếu chưa thử fallback, thì thử với fallback URLs
            if (!useFallback && !usingFallbackUrls) {
                console.log('Trying with fallback URLs...');
                loadFiles(true);
                return;
            }

            // Chỉ hiển thị lỗi nếu thực sự có lỗi nghiêm trọng
            // Không hiển thị lỗi cho trường hợp không có file multimedia
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            if (!errorMessage.includes('non-JSON response')) {
                setError(errorMessage);
            }
            // Nếu là lỗi non-JSON response, có thể là do không có file, set files = []
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    // Build direct CDN URL for fallback
    const buildDirectCdnUrl = (fileName: string, fileType: number): string => {
        const folder = getFolderByType(fileType);
        return `https://datauploads.sgp1.cdn.digitaloceanspaces.com/${folder}/${fileName}`;
    };

    // Get folder name by file type
    const getFolderByType = (fileType: number): string => {
        switch (fileType) {
            case 1: return 'audio';
            case 2: return 'images';
            case 3: return 'documents';
            case 4: return 'videos';
            default: return 'files';
        }
    };

    const handleMediaError = (e: React.SyntheticEvent<HTMLAudioElement | HTMLImageElement>, file: FileData) => {
        console.error(`Media load error for ${file.TenFile}:`, e);

        // Thử với URL trực tiếp từ CDN nếu chưa thử
        if (!usingFallbackUrls) {
            const directUrl = buildDirectCdnUrl(file.TenFile, file.LoaiFile);

            // Cập nhật file URL và thử lại
            setFiles(currentFiles =>
                currentFiles.map(f =>
                    f.MaFile === file.MaFile
                        ? { ...f, ResolvedUrl: directUrl, UrlType: 'DIRECT_CDN' as any }
                        : f
                )
            );

            setUsingFallbackUrls(true);
        } else {
            setError(`Không thể load media: ${file.TenFile}`);
        }
    };

    const renderAudioPlayer = (file: FileData) => (
        <Card
            key={file.MaFile}
            size="small"
            className="mb-2"
            title={
                <div className="flex items-center gap-2">
                    <SoundOutlined />
                    {showFileName && <span>{file.TenFile}</span>}
                </div>
            }
        >
            <audio
                controls
                className="w-full"
                preload="metadata"
                onError={(e) => handleMediaError(e, file)}
            >
                <source src={file.ResolvedUrl} type="audio/mpeg" />
                <source src={file.ResolvedUrl} type="audio/wav" />
                Trình duyệt không hỗ trợ audio player.
            </audio>

            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
                <div>URL Type: {file.UrlType}</div>
                <div>URL: {file.ResolvedUrl}</div>
            </div>
        </Card>
    );

    const renderImageViewer = (file: FileData) => (
        <Card
            key={file.MaFile}
            size="small"
            className="mb-2"
            title={
                <div className="flex items-center gap-2">
                    <FileImageOutlined />
                    {showFileName && <span>{file.TenFile}</span>}
                </div>
            }
        >
            <img
                src={file.ResolvedUrl}
                alt={file.TenFile}
                className="max-w-full h-auto"
                onError={(e) => handleMediaError(e, file)}
            />

            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
                <div>URL Type: {file.UrlType}</div>
                <div>URL: {file.ResolvedUrl}</div>
            </div>
        </Card>
    );

    const renderFileLink = (file: FileData) => (
        <Card
            key={file.MaFile}
            size="small"
            className="mb-2"
        >
            <Button
                type="link"
                href={file.ResolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                📎 {file.TenFile}
            </Button>

            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
                <div>Type: {file.LoaiFile}</div>
                <div>URL: {file.ResolvedUrl}</div>
            </div>
        </Card>
    );

    const renderFile = (file: FileData) => {
        switch (file.LoaiFile) {
            case 1: // Audio
                return renderAudioPlayer(file);
            case 2: // Image
                return renderImageViewer(file);
            case 3: // Document
            case 4: // Video
            default:
                return renderFileLink(file);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <Spin size="small" />
                <div className="mt-2 text-sm text-gray-500">Đang tải multimedia...</div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Lỗi tải multimedia"
                description={error}
                type="error"
                showIcon
                action={
                    <Button size="small" onClick={() => loadFiles()}>
                        Thử lại
                    </Button>
                }
            />
        );
    }

    if (files.length === 0) {
        return null; // Không hiển thị gì nếu không có files
    }

    return (
        <div className="multimedia-player">
            {files.map(renderFile)}
        </div>
    );
};

export default MediaPlayer;
