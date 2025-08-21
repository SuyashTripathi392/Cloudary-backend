// routes/searchRoutes.js
import express from "express";
import { searchFilesAndFolders } from "../controllers/searchController.js";
import { verifyToken } from "../middleware/verifyToken.js"; // JWT check

const searchRoutes = express.Router();

// 🔍 Search files & folders
searchRoutes.get("/search", verifyToken, searchFilesAndFolders);

export default searchRoutes;
