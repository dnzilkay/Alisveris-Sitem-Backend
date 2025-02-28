import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const router = Router();
const prisma = new PrismaClient();

router.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Tüm Ürünleri Listeleme
router.get('/', async (req, res) => {
    const { isActive } = req.query;

    try {
        const products = await prisma.product.findMany({
            where: isActive !== undefined ? { isActive: isActive === 'true' } : undefined,
            include: {
                images: true, // Resim verilerini dahil et
                Category: true, // Kategori verilerini dahil et
            },
        });

        res.json(products);
    } catch (error) {
        console.error("Ürün listeleme hatası:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Ürün Detayı Getirme
//@ts-ignore
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                images: true, // Resim verilerini dahil et
                Category: true, // Kategori verilerini dahil et
            },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error("Ürün detayı hatası:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Yeni Ürün Ekleme veya Stok Güncelleme
//@ts-ignore
router.post('/', async (req, res) => {
    const { name, price, stock, categoryId, images, isActive } = req.body;

    if (!name || typeof name !== 'string' || price == null || stock == null) {
        return res.status(400).json({ error: 'Invalid product data' });
    }

    try {
        const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!categoryExists) {
            return res.status(400).json({ error: 'Category not found' });
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                price,
                stock,
                categoryId,
                isActive: isActive ?? true,
            },
        });

        // Resimlerin ürüne eklenmesi
        if (images && Array.isArray(images)) {
            for (const imageUrl of images) {
                await prisma.image.create({
                    data: {
                        url: imageUrl,
                        productId: newProduct.id,
                    },
                });
            }
        }

        const enrichedProduct = await prisma.product.findUnique({
            where: { id: newProduct.id },
            include: {
                images: true, // Resim verilerini dahil et
                Category: true, // Kategori verilerini dahil et
            },
        });

        res.status(201).json(enrichedProduct);
    } catch (error) {
        console.error("Ürün ekleme hatası:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Ürün Güncelleme
//@ts-ignore
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, categoryId, images, isActive } = req.body;

    try {
        const product = await prisma.product.findUnique({ where: { id: Number(id) } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: { name, price, stock, categoryId, isActive },
        });

        // Resimleri güncelleme
        if (images && Array.isArray(images)) {
            await prisma.image.deleteMany({ where: { productId: updatedProduct.id } });
            for (const imageUrl of images) {
                await prisma.image.create({
                    data: {
                        url: imageUrl,
                        productId: updatedProduct.id,
                    },
                });
            }
        }

        const enrichedProduct = await prisma.product.findUnique({
            where: { id: updatedProduct.id },
            include: {
                images: true, // Resim verilerini dahil et
                Category: true, // Kategori verilerini dahil et
            },
        });

        res.json(enrichedProduct);
    } catch (error) {
        console.error("Ürün güncelleme hatası:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Ürün Silme (Pasif Hale Getirme)
//@ts-ignore
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({ where: { id: Number(id) } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const deactivatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: { isActive: false },
        });

        res.json({
            message: 'Product deactivated successfully.',
            product: deactivatedProduct,
        });
    } catch (error) {
        console.error("Ürün silme hatası:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
