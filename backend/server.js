import express, { response } from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./aws_s3.js";

import axios from "axios";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

fs.mkdirSync("uploads", { recursive: true });
fs.mkdirSync("uploads/jd", { recursive: true });

const FLASK_URL = "http://localhost:8000";

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/");
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const jd_storage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, "uploads/jd");
    },
    filename: (req, file, cb)=>{
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage, 
    fileFilter: (req, file, cb)=>{
        if (path.extname(file.originalname).toLowerCase() !== ".zip"){
            return cb(new Error("Only ZIP files are allowed"));
        }
        cb(null, true);
    }
});

const jd_upload = multer({
    storage : jd_storage,
    fileFilter:(req, file, cb)=>{
        const allowed = [".pdf", ".doc", ".docx"];

        if(!allowed.includes(path.extname(file.originalname).toLowerCase())){
            return cb(new Error("File type not supported"));
        }
        cb(null, true);
    }
});



// 1. Put this global job store at the very top of your file (if you haven't already)
const jobs = {};

// 2. Updated /upload route
app.post("/upload", upload.single("zipFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        console.log("File uploaded locally to:", req.file.path);

        // Generate a unique ID for this job
        const jobId = Date.now().toString();
        
        // Initialize the job status tracking
        jobs[jobId] = {
            status: "processing",
            s3Key: `zips/${req.file.filename}`,
            localPath: req.file.path,
            result: null,
            error: null
        };

        // Stream the file to AWS S3 asynchronously
        // We catch errors inside to update the background job state properly
        s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `zips/${req.file.filename}`,
                Body: fs.createReadStream(req.file.path),
                ContentType: req.file.mimetype 
            })
        ).catch(err => {
            console.error(`S3 Upload failed for job ${jobId}:`, err.message);
        });
        const sessionId = req.body.sessionId || "default-session";

        axios.post(`${FLASK_URL}/process-zip`,{
            filePath : req.file.path,
            sessionId: sessionId
        })
        .then(response => {
            if(response.data.success){
                jobs[jobId].status = "completed";
                jobs[jobId].result = response.data.result;
            }else{
                jobs[jobId].status = "failed";
                jobs[jobId].error = response.data.error || "Unknown Flask error";
            }
        })
        .catch(err =>{
            console.error(`Flask process-zip request failed for job ${jobId}:`, err.message);
            jobs[jobId].status = "failed";
            jobs[jobId].error = `AI Processing Service Error: ${err.message}`;
        });

        // CRITICAL: Return an instant response so Multer and the client connection don't abort
        res.status(202).json({
            success: true,
            message: "File received and processing in background.",
            jobId: jobId
        });

    } catch (err) {
        console.error("Route exception handler reached:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/upload-jd",jd_upload.single("document"), async (req, res)=>{
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }

    try {
        console.log("JD uploaded locally to:", req.file.path);

        const sessionId = req.body.sessionId || "default-session";

        const response = await axios.post(`${FLASK_URL}/process-jd`, {
            filePath : req.file.path,
            sessionId: sessionId
        });

        if(response.data.success){
            res.json({
                succes: true,
                candidates: response.data.result
            });
        }else{
            res.status(500).json({ success: false, error: response.data.error });
        }
    }catch(err){
        console.error("Failed to query local AI service for JD:", err.message);
        res.status(500).json({
            success: false,
            error: `AI Service Connection Error: ${err.message}`
        });
    }
});

app.get("/job-status/:jobId", (req, res) => {
    const { jobId } = req.params;
    const job = jobs[jobId];

    if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({
        success: true,
        status: job.status,
        s3Key: job.s3Key,
        localPath: job.localPath,
        data: job.result,
        error: job.error
    });
});

const PORT = process.env.PORT || 5000;

console.log("PORT =", process.env.PORT);
console.log("AWS_REGION =", process.env.AWS_REGION);
console.log("Starting server...");

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});