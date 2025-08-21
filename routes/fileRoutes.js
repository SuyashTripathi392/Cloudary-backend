import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import {
    uploadFile,
    getFiles,
    moveFileToTrash,
    restoreFile,
    getTrashFiles,
    permanentDeleteFile,
    renameFile,
    getRootFiles,
    getAllFilesGrouped,
} from "../controllers/filesController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const fileRoutes = express.Router();

fileRoutes.use(verifyToken)


// Root folder ke liye file upload
fileRoutes.post('/upload', upload.single('file'), uploadFile);
// 1. File upload + DB insert
fileRoutes.post('/upload/:folder_id', upload.single('file'), uploadFile);


// 2. Folder ke files fetch karna
fileRoutes.get("/folder/:folder_id/files", getFiles);
fileRoutes.get("/root", getRootFiles);
fileRoutes.get("/all",  getAllFilesGrouped);

// 3. File ko trash me move karna (soft delete)
fileRoutes.patch("/:id/trash", moveFileToTrash);

// 4. Trash se file restore karna
fileRoutes.patch("/:id/restore", restoreFile);

// 5. Trash me jo files hain wo fetch karna
fileRoutes.get("/trash", getTrashFiles);

// 6. File ko permanently delete karna
fileRoutes.delete("/:id/permanent", permanentDeleteFile);

// 7. File rename karna
fileRoutes.patch("/:id/rename", renameFile);

export default fileRoutes;
