import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany();
        console.log('Tüm Ürünler:', products);
    } catch (error) {
        console.error('Hata:', JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
