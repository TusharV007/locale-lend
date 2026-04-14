export const uploadImage = async (file: File | Blob, path: string): Promise<string> => {
    try {
        const formData = new FormData();
        // Always provide a filename when appending a Blob/File to ensure server compatibility
        formData.append('file', file, 'upload.jpg');
        formData.append('path', path);

        const response = await fetch('/api/assets/store', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try { errorData = JSON.parse(errorText); } catch(e) {}
            throw new Error(errorData?.error || `Failed to upload: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};
