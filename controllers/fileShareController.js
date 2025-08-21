import crypto from "crypto";
import { supabase } from "../config/supabaseClient.js";
import { addSignedUrls } from "../utils/signedUrl.js";

// 📌 Generate Share Link (Public / Private with Email)
export const generateShareLink = async (req, res) => {
  const { file_id } = req.params;
  const { share_type, permission, shared_with, expires_in } = req.body;
  const owner_id = req.user.id;

  try {
    // Step 1: File ka naam fetch karo
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("name")
      .eq("id", file_id)
      .eq("user_id", owner_id)
      .single();

    if (fileError || !fileData) {
      return res.status(404).json({ message: "File not found" });
    }

    // Step 2: Private share ke liye email se user_id nikalna
    let targetUserId = null;
    if (share_type === "private" && shared_with) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", shared_with)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ message: "User with this email not found" });
      }
      targetUserId = userData.id;
    }

    // Step 3: Public share ke liye token generate
    let share_token = null;
    if (share_type === "public") {
      share_token = crypto.randomBytes(16).toString("hex");
    }

    // Step 4: Expiry time calculate
    let expires_at = null;
    if (expires_in) {
      expires_at = new Date(Date.now() + expires_in * 60 * 1000).toISOString();
    }

    // 🔑 Step 5: Sharer info nikalna
    const { data: sharerData, error: sharerError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", owner_id)
      .single();

    if (sharerError || !sharerData) {
      return res.status(404).json({ message: "Sharer not found" });
    }

    // Step 6: DB me save
    const { data, error } = await supabase
      .from("file_shares")
      .insert([{
        file_id,
        owner_id,
        filename: fileData.name,
        share_type,
        shared_with: targetUserId,
        permission,
        share_token,
        expires_at,
        shared_by: sharerData.name || sharerData.email, // 👈 sharer ka naam/email save
      }])
      .select();

    if (error) throw error;

    // Step 7: Public link banani
    let link = null;
    if (share_type === "public") {
      link = `${process.env.FRONTEND_URL}/shared/${share_token}`;
    }

    res.status(201).json({
      message: "Share link created successfully",
      share: data[0],
      link,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Public file fetch (by token)
export const getFileByShareToken = async (req, res) => {
  const { token } = req.params;

  try {
    const { data: shareData, error: shareError } = await supabase
      .from("file_shares")
      .select("file_id, owner_id, expires_at")
      .eq("share_token", token)
      .single();

    if (shareError || !shareData) {
      return res.status(404).json({ message: "Invalid or expired link" });
    }

    if (shareData.expires_at && new Date() > new Date(shareData.expires_at)) {
      return res.status(410).json({ message: "Link expired" });
    }

    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", shareData.file_id)
      .single();

    if (fileError) throw fileError;

    const filesWithUrls = await addSignedUrls([fileData], shareData.owner_id);

    res.status(200).json({ file: filesWithUrls[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// private files f

export const getPrivateSharedFile = async (req, res) => {
  const { share_id } = req.params; // id from file_shares table
  const user_id = req.user.id; // logged in user

  try {
    // 1) Fetch share record
    const { data: shareData, error: shareError } = await supabase
      .from("file_shares")
      .select("file_id, owner_id, shared_with, expires_at")
      .eq("id", share_id)
      .single();

    if (shareError) throw shareError;
    if (!shareData) return res.status(404).json({ message: "Share not found" });

    // 2) Check permission: allow if user is the explicit shared_with or the owner
    if (shareData.shared_with !== user_id && shareData.owner_id !== user_id) {
      return res.status(403).json({ message: "You don't have access to this file" });
    }

    // 3) Expiry check
    if (shareData.expires_at && new Date() > new Date(shareData.expires_at)) {
      return res.status(410).json({ message: "Link expired" });
    }

    // 4) Fetch file record
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", shareData.file_id)
      .single();

    if (fileError) throw fileError;
    if (!fileData) return res.status(404).json({ message: "File not found" });

    // 5) If file is soft-deleted (deleted=true), deny
    if (fileData.deleted) {
      return res.status(410).json({ message: "File is not available" });
    }

    // 6) Generate signed URL(s) and return single file
    const filesWithUrls = await addSignedUrls([fileData], shareData.owner_id);
    return res.status(200).json({ file: filesWithUrls[0] });
  } catch (err) {
    console.error("getPrivateSharedFile error:", err);
    return res.status(500).json({ message: err.message });
  }
};



// GET /shared/private/my-shares with manual signed URL and debug logs
export const getSharedWithMe = async (req, res) => {
  try {
    // get files shared with logged-in user
    const { data: sharedFiles, error } = await supabase
      .from("file_shares")
      .select("id, file_id, filename, owner_id, permission, shared_by") // shared_by include kiya
      .eq("shared_with", req.user.id);

    if (error) throw error;

    const filesWithUrls = [];

    for (let file of sharedFiles) {
      // signed url create
      const { data: urlData, error: urlError } = await supabase.storage
        .from("files")
        .createSignedUrl(`${file.owner_id}/${file.filename}`, 60 * 60); // 1 hour

      if (!urlError) {
        file.signed_url = urlData.signedUrl;
        filesWithUrls.push(file);
        console.log(`✅ Signed URL generated: ${file.filename}`);
      } else {
        console.log(`❌ File not found in storage: ${file.filename}`, urlError);
      }
    }

    res.status(200).json({ files: filesWithUrls });
  } catch (err) {
    console.error("⚠️ Error in getSharedWithMe:", err);
    res.status(500).json({ message: err.message });
  }
};


export const removeSharedFile = async (req, res) => {
  try {
    const { id } = req.params; // share row id
    const userId = req.user.id;

    const { error } = await supabase
      .from("file_shares")
      .delete()
      .eq("id", id)
      .eq("shared_with", userId);

    if (error) throw error;

    res.status(200).json({ message: "File removed from your list" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
