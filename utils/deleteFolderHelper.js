// helpers/deleteFolderHelper.js
import { supabase } from '../config/supabaseClient.js';

export const deleteFolderRecursive = async (folderId, userId) => {
  // 1️⃣ Delete all files in this folder first
  const { data: files, error: fileError } = await supabase
    .from('files')
    .delete()
    .eq('folder_id', folderId)
    .eq('user_id', userId)
    .select();

  if (fileError) throw fileError;

  // 2️⃣ Get all direct subfolders
  const { data: subfolders, error: subError } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', folderId)
    .eq('user_id', userId);

  if (subError) throw subError;

  // 3️⃣ Recursively delete each subfolder
  for (let sub of subfolders) {
    await deleteFolderRecursive(sub.id, userId);
  }

  // 4️⃣ Delete the current folder
  const { data, error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', userId)
    .select();

  if (error) throw error;

  return data;
};
