import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import { pdfUpload } from "../middleware/multer";
import * as fs from "fs";

const routes = Router();

const internalServerError = {
    'error': true,
    'message': "something went wrong"
};

const convertToInteger = (value: string): number | null => {
    try {
        const intValue = Number(value);
        if (isNaN(intValue)) {
            throw new Error("Invalid integer");
        }
        return intValue;
    } catch (error) {
        console.log(error);
        return null;
    }

}

const convertFromBytes = (value: number): { value: number, unit: string } => {
    const BASE = 1024;
    const MB = Math.pow(BASE,2);
    const GB = Math.pow(BASE,3);

    if(value >= BASE && value < MB){
        return {value: value/1024,unit: 'kb'};
    }else if(value >= Math.pow(BASE,2) && value < GB){
        return {value: value/Math.pow(BASE,2),unit: 'mb'};
    }else if(value >= Math.pow(BASE,3)){
        return {value: value/Math.pow(BASE,2),unit: 'gb'};
    }

    return { value: value, unit: 'b' };
}

routes.get('/test/:number',(req: Request,res: Response) => {
    const size = convertFromBytes(parseFloat(req.params.number));
    return res.status(200).json(size);
});


routes.post("/:filename", pdfUpload.single("pdf"), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            error: true,
            message: 'file needed'
        });
    }

    const fileName = req.params.filename;
    const pdfName: string = req.file.filename;
    const pdfUrl: string = `uploads/${pdfName}`;
    const pdfSize = convertFromBytes(req.file.size);

    try {

        const prisma: PrismaClient = res.locals.prisma as PrismaClient;
        const newPdf = await prisma.pdf.create({
            data: {
                name: fileName,
                url: pdfUrl,
                size: pdfSize.value,
                unit: pdfSize.unit
            }
        });

        if (newPdf) {
            return res.status(200).json({
                'error': false,
                'message': "pdf has been uploaded successfully"
            });
        }
        return res.status(500).json(internalServerError);

    } catch (error) {
        return res.status(500).json(internalServerError);
    }
});

routes.get("/search/:filename", async (req: Request, res: Response) => {
    const fileName = req.params.filename;

    try {
        const prisma: PrismaClient = res.locals.prisma as PrismaClient;
        const pdf = await prisma.pdf.findMany({
            where: {
                OR: [
                    { name: { contains: fileName } }
                ]
            }
        });

        return res.status(200).json({
            'error': false,
            'data': pdf
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json(internalServerError)
    }
});

routes.get("/:id", async (req: Request, res: Response) => {
    let id: number | null = convertToInteger(req.params.id);

    if (!id) {
        return res.status(400).json({
            'error': true,
            'message': "id must be an integer"
        });
    }

    try {
        const prisma: PrismaClient = res.locals.prisma as PrismaClient;
        const pdf = await prisma.pdf.findFirst({ where: { id: id } });

        if (pdf) {
            const filePath = pdf.url;
            console.log(pdf);

            const readStream = fs.createReadStream(filePath);
            res.set('Content-Type', 'application/pdf');
            return readStream.pipe(res);
        }

        return res.status(400).json({
            'error': true,
            'message': "file not found"
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json(internalServerError)
    }
});

routes.delete("/:id", async (req: Request, res) => {
    let id: number | null = convertToInteger(req.params.id);

    if (!id) {
        return res.status(400).json({
            'error': true,
            'message': "id must be an integer"
        });
    }


    const prisma: PrismaClient = res.locals.prisma as PrismaClient;
    let pdf;
    try {
        pdf = await prisma.pdf.findFirst({ where: { id: id } });
        console.log("")
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            'error': true,
            'message': "something went wrong"
        });
    }

    if (pdf) {
        const deletedFile = await prisma.pdf.delete({ where: { id: id } });
        if (deletedFile) {
            if (fs.existsSync(pdf.url)) {
                fs.unlinkSync(pdf.url);
                return res.status(200).json({
                    'error': true,
                    'message': "file was deleted"
                });
            } else {
                return res.status(404).json({
                    'error': true,
                    'message': "file not found"
                });
            }

        } else {
            return res.status(500).json(internalServerError);
        }
    }
    return res.status(404).json({
        'error': true,
        'message': "file not found"
    });
});

export default routes;