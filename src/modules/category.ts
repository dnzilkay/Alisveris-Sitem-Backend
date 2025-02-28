import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const router = Router();
const prisma = new PrismaClient();

router.use(
    cors({
        origin: 'http://localhost:5173', // Frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
);

// Tüm Kategorileri Listeleme
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { products: true },
        });
        res.json(categories);
    } catch (error) {
        console.error('Kategori listeleme hatası:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Kategori Detayı Getirme
//@ts-ignore
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const category = await prisma.category.findUnique({
            where: { id: Number(id) },
            include: { products: true },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const products = await prisma.product.findMany({
            where: { categoryId: Number(id) },
        });

        res.json({ ...category, products });
    } catch (error) {
        console.error('Kategori detayı hatası:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Yeni Kategori Ekleme
//@ts-ignore
router.post('/', async (req, res) => {
    const { name,description,isActive, } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Invalid category name' });
    }

    try {
        const existingCategory = await prisma.category.findUnique({
            where: { name,
                description,
                isActive: isActive ?? true, },
        });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category already exists' });
        }

        const newCategory = await prisma.category.create({ data: { name,description,isActive } });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Kategori ekleme hatası:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Kategori Güncelleme
//@ts-ignore
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Invalid category name' });
    }

    try {
        const updatedCategory = await prisma.category.update({
            where: { id: Number(id) },
            data: { name,
                description,
                isActive,
            },
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error('Kategori güncelleme hatası:', error);
        res.status(404).json({ error: 'Category not found' });
    }
});

// Kategori Silme
//@ts-ignore
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const category = await prisma.category.findUnique({
            where: { id: Number(id) },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // "Diğer" kategorisini kontrol et veya oluştur
        const otherCategory = await prisma.category.upsert({
            where: { name: 'Diğer' },
            update: {},
            create: { name: 'Diğer' },
        });

        // Ürünleri "Diğer" kategorisine taşı
        await prisma.product.updateMany({
            where: { categoryId: Number(id) },
            data: { categoryId: otherCategory.id },
        });

        // Kategoriyi sil
        await prisma.category.delete({ where: { id: Number(id) } });

        res.json({
            message: 'Category deleted and products moved to "Diğer" category.',
        });
    } catch (error) {
        console.error('Kategori silme hatası:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
