import express, {Request, Response} from "express"
import { ValidationRequest, accessValidation } from "../auth/auth.middleware";
import { createProduct, getProductById, getProductByUserId, getProducts } from "./product.service";
import { prisma } from "../db";

const router = express.Router()

router.get("/getProducts", async (req: Request, res: Response) => {
    const product = await getProducts()
    return res.status(200).json(product)
})

router.get("/getProductById/:id",async (req: Request, res: Response) => {
    const productId = req.params.id
    const product = await getProductById(productId)
    return res.status(200).json(product)
})

router.post("/createProduct", accessValidation, async (req: Request, res: Response) => {
    const validationReq = req as ValidationRequest;
    const productData = validationReq.body;

    try {
        const userId = String(validationReq.userData?.id);

        if (userId === undefined) {
            return res.status(400).json({
                message: 'User ID is missing in the request.'
            });
        }

        const product = await createProduct(productData, userId)

        return res.status(201).json({
            product
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message
        });
    }
});




router.put("/updateProduct/:productId", accessValidation, async (req: Request, res: Response) => {
    const validationReq = req as ValidationRequest;
    const productData = validationReq.body;
    const productId = req.params.productId

    try {
        const userId = validationReq.userData?.id;

        if (userId === undefined) {
            return res.status(400).json({
                message: 'User ID is missing in the request.'
            });
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name: productData.name,
                description: productData.description,
                image: productData.image,
                price: productData.price,
                userId: String(userId)
            }
        });

        return res.status(200).json({
            product: updatedProduct
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message
        });
    }
});

router.get("/getProductByUserId/:userId", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    
    try {
        const products = await getProductByUserId(userId);
        return res.status(200).json(products);
    } catch (error: any) {
        return res.status(404).json({ error: error.message });
    }
});

router.delete("/deleteProduct/:productId", accessValidation, async (req: Request, res: Response) => {
    const validationReq = req as ValidationRequest;
    const productId = req.params.productId

    try {
        const userId = validationReq.userData?.id;

        if (userId === undefined) {
            return res.status(400).json({
                message: 'User ID is missing in the request.'
            });
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        await prisma.product.delete({
            where: { id: productId },
        });

        return res.status(204).send(); // 204 No Content for successful deletion
    } catch (error: any) {
        return res.status(500).json({
            message: error.message
        });
    }
});




export default router

// prisma.product.create({
//     data: {
//         name: productData.name,
//         description: productData.description,
//         image: productData.image,
//         price: productData.price,
//         userId: String(userId)
//     }
// });