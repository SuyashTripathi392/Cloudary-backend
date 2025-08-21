import { supabase } from "../config/supabaseClient.js";
import { groupFilesByFolder } from "../utils/groupFiles.js";
import { addSignedUrls } from "../utils/signedUrl.js";
// 📂 File Upload Controller (file upload + DB insert ek saath)
export const uploadFile = async (req, res) => {
  try {


    // Multer se aayi hui file
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // JWT se user ka ID
    const user_id = req.user.id;

    // Folder ID agar front-end se aaya ho to use karenge, warna null
    const { folder_id } = req.params;

    // Unique file name (timestamp + original name)
    const fileName = `${Date.now()}_${file.originalname}`;

    // Supabase Storage me file upload karna
    const { error: uploadError } = await supabase.storage
      .from("files") // 🪣 Bucket ka naam
      .upload(`${user_id}/${fileName}`, file.buffer, {
        contentType: file.mimetype, // MIME type set karna
        upsert: false, // overwrite avoid karega
      });

    if (uploadError) throw uploadError;

    // Signed URL banani (private bucket ke liye)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("files")
      .createSignedUrl(`${user_id}/${fileName}`, 60 * 60); // 1 hour valid

    if (signedError) throw signedError;

    // DB me file ka record insert karna
    const { data: dbData, error: dbError } = await supabase
      .from("files")
      .insert([
        {
          name: fileName,
          folder_id: folder_id || null,
          user_id,
          size: file.size,
          type: file.mimetype,
          deleted: false,
        },
      ])
      .select();

    if (dbError) throw dbError;

    // Response bhejna
    return res.status(201).json({
      message: "File uploaded successfully",
      file: dbData[0], // jo DB me insert hua wo
      signedUrl: signedData.signedUrl, // signed URL (1 hour valid)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// Folder ke andar ke files ko fetch karna
export const getFiles = async (req, res) => {
  const { folder_id } = req.params;
  const user_id = req.user.id;

  try {
    const { data: files, error } = await supabase
      .from("files")
      .select("*")
      .eq("folder_id", folder_id)
      .eq("user_id", user_id)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 📌 Helper function ka return naam ab controller decide karega
    const filesWithUrls = await addSignedUrls(files, user_id);

    res.status(200).json({ files: filesWithUrls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getRootFiles = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data: files, error } = await supabase
      .from("files")
      .select("*")
      .is("folder_id", null)  // folder_id null hone par root folder samjho
      .eq("user_id", user_id)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const filesWithUrls = await addSignedUrls(files, user_id);
    res.status(200).json({ files: filesWithUrls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//get all files
export const getAllFilesGrouped = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Sabhi files fetch karo user ke liye (deleted=false wali)
    const { data: files, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", user_id)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Sab files ke signed URLs add karo
    const filesWithUrls = await addSignedUrls(files, user_id);

    // Files ko group karo root aur folders ke hisaab se
    const groupedFiles = groupFilesByFolder(filesWithUrls);

    // Response bhejo grouped data ke saath
    res.status(200).json(groupedFiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// File ko trash me move karna (soft delete)
export const moveFileToTrash = async (req, res) => {
  const { id } = req.params; // file id
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('files')
      .update({ deleted: true }) // deleted = true matlab trash me
      .eq('id', id)
      .eq('user_id', user_id)
      .select();

    if (error) throw error;
    if (!data.length) return res.status(404).json({ message: 'File not found' });

    res.status(200).json({ message: 'File moved to trash', file: data[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Trash se file restore karna
export const restoreFile = async (req, res) => {
  const { id } = req.params; // file id
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('files')
      .update({ deleted: false }) // deleted = false matlab restore
      .eq('id', id)
      .eq('user_id', user_id)
      .select();

    if (error) throw error;
    if (!data.length) return res.status(404).json({ message: 'File not found in trash' });

    res.status(200).json({ message: 'File restored', file: data[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Trash me jo files hain wo fetch karna
export const getTrashFiles = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user_id)
      .eq('deleted', true) // deleted=true matlab trash files
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ trash: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// File ko permanent delete karna (storage bucket se bhi delete karna)
export const permanentDeleteFile = async (req, res) => {
  const { id } = req.params; // file id
  const user_id = req.user.id;

  try {
    // Pehle DB se file ka naam nikal lo taaki storage me delete kar sako
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('name')
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('deleted', true) // sirf trash files hi delete karna
      .single();

    if (fileError) throw fileError;
    if (!fileData) return res.status(404).json({ message: 'File not found in trash' });

    // Storage bucket se file delete karna
    const { error: removeError } = await supabase.storage
      .from('files')
      .remove([`${user_id}/${fileData.name}`]);

    if (removeError) throw removeError;

    // DB se file ka record delete karna
    const { data: deletedData, error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('deleted', true)
      .select();

    if (deleteError) throw deleteError;
    if (!deletedData.length) return res.status(404).json({ message: 'File not found in trash' });

    res.status(200).json({ message: 'File permanently deleted', file: deletedData[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// File ka naam rename karna
export const renameFile = async (req, res) => {
  const { id } = req.params; // file id
  const { name } = req.body;
  const user_id = req.user.id;

  try {
    // 1. Fetch the original file
    const { data: oldFile, error: fetchError } = await supabase
      .from("files")
      .select("name")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetchError) throw fetchError;
    if (!oldFile) return res.status(404).json({ message: "File not found" });

    const oldName = oldFile.name;
    const oldExt = oldName.split('.').pop();
    
    // 2. Process the new name
    let safeNameWithExt;
    const userProvidedExt = name.split('.').pop();
    
    if (userProvidedExt === oldExt) {
      // User included the correct extension
      safeNameWithExt = name.trim().replace(/\s+/g, '_');
    } else if (name.includes('.')) {
      // User provided a different extension - use theirs
      safeNameWithExt = name.trim().replace(/\s+/g, '_');
    } else {
      // User didn't provide extension - add the original one
      const safeName = name.trim().replace(/\s+/g, '_');
      safeNameWithExt = `${safeName}.${oldExt}`;
    }

    console.log("Old file path:", `${user_id}/${oldName}`);
    console.log("New file path:", `${user_id}/${safeNameWithExt}`);

    // 3. Rename in storage
    const { error: moveError } = await supabase.storage
      .from("files")
      .move(`${user_id}/${oldName}`, `${user_id}/${safeNameWithExt}`);

    if (moveError) {
      console.error("Move error:", moveError);
      throw moveError;
    }

    // 4. Update database
    const { data, error } = await supabase
      .from('files')
      .update({ name: safeNameWithExt })
      .eq('id', id)
      .eq('user_id', user_id)
      .select();

    if (error) throw error;
    if (!data.length) return res.status(404).json({ message: 'File not found' });

    res.status(200).json({ message: 'File renamed successfully', file: data[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};