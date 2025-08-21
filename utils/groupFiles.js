export const groupFilesByFolder = (files) => {
  const rootFiles = [];
  const folders = {};

  files.forEach(file => {
    if (!file.folder_id) {
      rootFiles.push(file);
    } else {
      if (!folders[file.folder_id]) {
        folders[file.folder_id] = [];
      }
      folders[file.folder_id].push(file);
    }
  });

  return { rootFiles, folders };
};
