
/**
 * Cloudinary Service
 * Centralized logic for managing Cloudinary uploads via REST API.
 */

const CLOUD_NAME = "dheayouzu"; 
const UPLOAD_PRESET = "touggourt_perset"; // Based on your dashboard screenshot: p-e-r-s-e-t

/**
 * Uploads a file directly to Cloudinary using the REST API.
 * @param file The File object from an input[type="file"]
 * @returns The secure_url of the uploaded image
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  console.log(`Uploading to Cloudinary [${CLOUD_NAME}] with preset [${UPLOAD_PRESET}]...`);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudinary Upload Error Details:", data);
      throw new Error(data.error?.message || "Failed to upload to Cloudinary");
    }

    console.log("Cloudinary Upload Success:", data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error("Cloudinary Service Error:", error);
    throw error;
  }
};

/**
 * Fallback: Opens the Cloudinary Upload Widget if you prefer the official UI.
 */
export const openUploadWidget = (
  onSuccess: (url: string) => void,
  onLoading?: (isLoading: boolean) => void
) => {
  // @ts-ignore
  if (!window.cloudinary) {
    alert("Cloudinary SDK not loaded. Please use the direct upload option or refresh.");
    return;
  }

  try {
    if (onLoading) onLoading(true);
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        multiple: false,
        resourceType: 'image',
      },
      (error: any, result: any) => {
        if (error) {
          console.error("Widget Error:", error);
          if (onLoading) onLoading(false);
        }
        if (result && result.event === "success") {
          onSuccess(result.info.secure_url);
          if (onLoading) onLoading(false);
        }
        if (result && result.event === "close") {
          if (onLoading) onLoading(false);
        }
      }
    );
    widget.open();
  } catch (err) {
    console.error("Widget launch failed:", err);
    if (onLoading) onLoading(false);
  }
};
