
/**
 * Cloudinary Service
 * Centralized logic for direct image uploads via Cloudinary REST API.
 */

const CLOUD_NAME = "dheayouzu"; 
const UPLOAD_PRESET = "touggourt_perset"; 

/**
 * Uploads a file directly to Cloudinary using the REST API.
 * This method is robust, easy to debug in the Network tab, and avoids widget conflicts.
 * @param file The File object from an input[type="file"]
 * @returns The secure_url of the uploaded image
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  console.log(`[Cloudinary Service] Uploading to ${CLOUD_NAME} using preset ${UPLOAD_PRESET}...`);

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
      console.error("[Cloudinary Service] Upload failed. Error data:", data);
      throw new Error(data.error?.message || "Failed to upload to Cloudinary. Check your preset settings.");
    }

    console.log("[Cloudinary Service] Upload successful:", data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error("[Cloudinary Service] Network or API error:", error);
    throw error;
  }
};
