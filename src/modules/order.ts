import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const router = Router();
const prisma = new PrismaClient();

router.use(
    cors({
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
type Item = {
    productId: number;
    quantity: number;
};


// Tüm Siparişleri Listeleme
router.get("/", async (req, res) => {
    const { userId } = req.query;

    try {
        const orders = await prisma.order.findMany({
            where: userId ? { userId: Number(userId) } : undefined,
            include: {
                items: {
                    include: { Product: true },
                },
                User: true,
            },
        });

        res.json(orders);
    } catch (error) {
        console.error("Tüm Siparişler Alınırken Hata:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Sipariş Detayı Getirme
//@ts-ignore
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                items: {
                    include: { Product: true },
                },
                User: true,
            },
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error("Sipariş Detayı Alınırken Hata:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Yeni Sipariş Oluşturma
//@ts-ignore
router.post("/", async (req, res) => {
    const { userId, items, deliveryAddress, paymentType, price } = req.body;

    try {
        const parsedUserId = Number(userId);
        const preparedItems = await Promise.all(
            items.map(async (item: Item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found.`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ID: ${item.productId}`);
                }

                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                };
            })
        );

        const newOrder = await prisma.order.create({
            data: {
                userId: parsedUserId,
                deliveryAddress,
                paymentType,
                status: "Ödeme Bekleniyor",
                items: {
                    create: preparedItems,
                },
                price: price,
            },
            include: {
                items: {
                    include: { Product: true },
                },
            },
        });

        res.status(201).json(newOrder);
    } catch (error) {
        console.error("Sipariş Oluşturulurken Hata:", error);
        res.status(500).json({ error: error || "Internal server error" });
    }
});


// Sipariş Durumunu Güncelleme
//@ts-ignore
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await prisma.order.findUnique({ where: { id: Number(id) } });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error("Sipariş Durumu Güncellenirken Hata:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
