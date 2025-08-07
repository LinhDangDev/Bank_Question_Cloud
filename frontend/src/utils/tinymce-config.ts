export const createTinyMCEConfig = (height: number = 120, isMinimal: boolean = false) => {
    const baseConfig = {
        height,
        menubar: false,
        mathjax: {
            lib: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
        },
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        images_upload_handler: (blobInfo: any, progress: any) => new Promise((resolve, reject) => {
            console.log('🖼️ TinyMCE uploading image:', {
                filename: blobInfo.filename(),
                size: blobInfo.blob().size,
                type: blobInfo.blob().type
            });

            const formData = new FormData();
            formData.append('file', blobInfo.blob(), blobInfo.filename());

            fetch('/api/files-spaces/upload-editor-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData
            })
                .then(async response => {
                    console.log('📡 Upload response:', response.status, response.statusText);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ Upload failed:', errorText);
                        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('✅ Upload successful:', result);
                    resolve(result.location);
                })
                .catch(error => {
                    console.error('❌ TinyMCE upload error:', error);
                    reject('Image upload failed: ' + error.message);
                });
        }),
        automatic_uploads: true,
        file_picker_types: 'image',
        images_upload_credentials: true,
    };

    if (isMinimal) {
        return {
            ...baseConfig,
            plugins: ['advlist autolink lists link image charmap', 'searchreplace', 'table', 'mathjax'],
            toolbar: 'bold italic | bullist numlist | link image | mathjax',
        };
    }

    return {
        ...baseConfig,
        plugins: [
            'advlist autolink lists link image charmap preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table code help wordcount',
            'mathjax',
            'table',
            'media',
            'codesample',
        ],
        toolbar:
            'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | fontselect fontsizeselect formatselect | forecolor backcolor removeformat | subscript superscript | link image media table codesample blockquote | mathjax',
        toolbar_mode: 'sliding',
    };
};

export const TINYMCE_API_KEY = "6gjaodohdncfz36azjc7q49f26yrhh881rljxqshfack7cax";
