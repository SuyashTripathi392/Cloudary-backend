import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from "./routes/fileRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import fileShareRoutes from "./routes/fileShareRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000





app.use(cors({
  origin: "https://cloudary-frontend.vercel.app/", 
  credentials: true
}));

app.use(express.json())
app.use(cookieParser()); 


app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use("/api", searchRoutes); 
app.use("/api", fileShareRoutes); 

app.get('/',(req,res)=>{
    res.send("Cloudary Api is running")
})




app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});