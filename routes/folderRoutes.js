import express from 'express';
import { createFolder, getFolders, getSubfolders, getTrash, moveToTrash, permanentDelete, renameFolder, restoreFolder } from '../controllers/folderController.js';
import { verifyToken } from '../middleware/verifyToken.js';


const folderRoutes = express.Router();

folderRoutes.post('/create', verifyToken, createFolder);           // root folder
folderRoutes.post('/create/:parent_id', verifyToken, createFolder); // subfolder


folderRoutes.get('/', verifyToken, getFolders);
folderRoutes.get('/sub/:parent_id', verifyToken, getSubfolders);
folderRoutes.put('/:id', verifyToken, renameFolder);
folderRoutes.delete('/:id', verifyToken, moveToTrash); // soft delete
folderRoutes.put('/restore/:id', verifyToken, restoreFolder);
folderRoutes.get('/trash', verifyToken, getTrash);
folderRoutes.delete('/permanent/:id', verifyToken, permanentDelete); // permanent delete
export default folderRoutes;
