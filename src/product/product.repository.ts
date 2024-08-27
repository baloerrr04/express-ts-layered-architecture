import { prisma } from "../db";


const findProducts = async () => {
    const products = await prisma.product.findMany();
    return products
}

const findProductById = async (id: string) => {
    const product = await prisma.product.findUnique({
        where: {
            id
        }
    })

    return product
}

const findProductByUserId = async (userId: string) => {
    const product = await prisma.product.findFirst({
        where: {
            userId
        }
    })

    return product
}

const insertProduct = async (productData: any, userId: string) => {
    try {
        const product = await prisma.product.create({
            data: {
                name: productData.name,
                description: productData.description,
                image: productData.image,
                price: productData.price,
                userId: userId
            }
        });

        return product;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error; // Re-throw the error to propagate it further
    }
};

export {findProducts, findProductById, findProductByUserId, insertProduct}
