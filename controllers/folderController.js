import { supabase } from '../config/supabaseClient.js';
import { deleteFolderRecursive } from '../utils/deleteFolderHelper.js';

export const createFolder = async (req, res) => {
  const { name } = req.body;
  const { parent_id } = req.params;   // destructuring yahan hua
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('folders')
      .insert([
        {
          name,
          parent_id: parent_id || null,  // agar undefined ho toh null set kar de
          user_id,
          deleted: false
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Folder created successfully', folder: data?.[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getFolders = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user_id)
      .eq('deleted', false) // ignore deleted folders
      .is('parent_id', null)
      .order('created_at', { ascending: false }); // latest first

    if (error) throw error;

    res.status(200).json({ folders: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// controllers/folderController.js
export const getSubfolders = async (req, res) => {
  const user_id = req.user.id;
  const { parent_id } = req.params; // parent folder id path param se

  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user_id)
      .eq('deleted', false)
      .eq('parent_id', parent_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ folders: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const renameFolder = async (req, res) => {
  const { id } = req.params; // folder ka id
  const { name } = req.body;
  const user_id = req.user.id;
  console.log(id)
  console.log(name )
  console.log( user_id)

  try {
    const { data, error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', id)
      .eq('user_id', user_id) // ensure folder belongs to logged-in user
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.status(200).json({ message: 'Folder renamed successfully', folder: data[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Move folder to trash (soft delete)
export const moveToTrash = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('folders')
    .update({ deleted: true })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) return res.status(400).json({ message: error.message });
  if (!data.length) return res.status(404).json({ message: 'Folder not found' });

  res.json({ message: 'Folder moved to trash', folder: data[0] });
};

// Restore folder from trash
export const restoreFolder = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('folders')
    .update({ deleted: false })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) return res.status(400).json({ message: error.message });
  if (!data.length) return res.status(404).json({ message: 'Folder not found' });

  res.json({ message: 'Folder restored', folder: data[0] });
};

// Get trash
export const getTrash = async (req, res) => {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('deleted', true);

  if (error) return res.status(400).json({ message: error.message });
  res.json({ trash: data });
};




export const permanentDelete = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const deletedData = await deleteFolderRecursive(id, user_id);

    if (!deletedData.length)
      return res.status(404).json({ message: 'Folder not found or already deleted' });

    res.json({ message: 'Folder and all subfolders permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
