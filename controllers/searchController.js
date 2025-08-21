import { supabase } from "../config/supabaseClient.js";

// 🔍 Search files & folders
export const searchFilesAndFolders = async (req, res) => {
  try {
    const userId = req.user.id; // verifyToken se aata hai
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }

    // Files
    const { data: files, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${query}%`);

    if (fileError) throw fileError;

    // Folders
    const { data: folders, error: folderError } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${query}%`);

    if (folderError) throw folderError;

    return res.json({
      files,
      folders,
    });
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
