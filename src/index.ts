import express, {Request, Response} from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import authRouter from "./auth/auth.controller"
import productRouter from "./product/product.controller"
import bodyParser from "body-parser"

const envPath = path.resolve(__dirname, '..', '.env.development');
dotenv.config({path: envPath})

const app = express()
const PORT = process.env.PORT

app.use(cors({
    credentials: true
}))

app.use(express.json())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter)
app.use("/product", productRouter)



app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
})
