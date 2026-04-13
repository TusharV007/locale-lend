export const uploadImage = async (file: File | Blob, path: string): Promise<string> => {
    try {
        const formData = new FormData();
        // Always provide a filename when appending a Blob/File to ensure server compatibility
        formData.append('file', file, 'upload.jpg');
        formData.append('path', path);

        const response = await fetch('/api/upload/s3', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload to S3');
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};
