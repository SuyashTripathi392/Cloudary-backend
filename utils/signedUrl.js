import { supabase } from "../config/supabaseClient.js";

// 📌 Helper function - Har file ke liye signed URL generate karega
export const addSignedUrls = async (files, user_id) => {
  const result = []; //  Internal naam alag rakha

  for (const file of files) {
    const path = `${user_id}/${file.name}`; // File ka path
     console.log("🔍 Trying path:", path); 

    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(path, 60 * 60); // 1 hour valid

    if (error) {
      console.error("Signed URL error:", error.message);
      result.push({ ...file, signedUrl: null });
    } else {
      result.push({ ...file, signedUrl: data.signedUrl });
    }
  }

  return result; // ✅ yeh naam controller decide karega
};
