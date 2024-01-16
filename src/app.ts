import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import handleErrors from './middleware/handleErrors';
import routes from './routes/routes';
import morgan from 'morgan';

const app: Application = express();
const prisma: PrismaClient = new PrismaClient();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*",
}));
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.prisma = prisma;
    next();
});
app.use(morgan("combined"));

app.use("/file",routes);

app.use(handleErrors);
app.listen(PORT, () => console.log(`server running on port ${PORT}`));