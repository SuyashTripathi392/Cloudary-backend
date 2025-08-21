import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { generateShareLink, getFileByShareToken, getPrivateSharedFile, getSharedWithMe, removeSharedFile } from "../controllers/fileShareController.js";

const fileShareRoutes = express.Router();

// Share link generate (auth required)
fileShareRoutes.post("/share/:file_id", verifyToken, generateShareLink);

// Public file access by token (no auth)
fileShareRoutes.get("/shared/:token", getFileByShareToken);
fileShareRoutes.get("/private/shared/:share_id", verifyToken, getPrivateSharedFile);
fileShareRoutes.get("/shared-with-me", verifyToken, getSharedWithMe);
fileShareRoutes.delete("/shared-with-me/:id", verifyToken, removeSharedFile);
export default fileShareRoutes;
