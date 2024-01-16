import multer,{FileFilterCallback} from "multer";
import * as path from "path"
import { Request } from "express";

const pdfStorage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,"uploads/");
    },
    filename: (req,file,cb) => {
        cb(null,Date.now() + path.extname(file.originalname));
    }
});

const pdfFilter = (req: Request,file: Express.Multer.File,cb: FileFilterCallback) => { //test before using
    const allowedMimeTypes = ['application/pdf'];
    if(!allowedMimeTypes.includes(file.mimetype)){
        return cb(new Error("LIMIT_INVALID_FILE_TYPE"));
    }
    return cb(null,true);
} 

const pdfUpload = multer({
    storage: pdfStorage,
    limits: {
        fileSize: 500 * 1024 * 1024
    },
    fileFilter: pdfFilter
});

export {pdfUpload};