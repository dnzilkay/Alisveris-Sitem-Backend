import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import cors from 'cors'; // CORS eklendi


const router = Router();
const prisma = new PrismaClient();
const SECRET_KEY = 'your-secret-key';

router.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Kullanıcı Kayıt
// Bu endpoint yeni bir kullanıcı oluşturur. Kullanıcı adı, e-posta ve şifre alır.
// Şifre hashlenerek güvenli bir şekilde kaydedilir.
router.post(
    '/register',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    //@ts-ignore
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role } = req.body;

        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    role: role || 'user', // Role gönderilmediyse 'user' olarak atanır
                },
            });

            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);


// Kullanıcı Giriş
// Bu endpoint kullanıcının e-posta ve şifre bilgilerini doğrular.
// Doğru bilgiler verilirse, bir JWT token ve kullanıcı rolü döndürülür.
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    //@ts-ignore
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

            res.json({
                token,
                role: user.role, // Kullanıcının rol bilgisi frontend için döndürülüyor
                username: user.username,
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Tüm Kullanıcıları Listeleme
// Bu endpoint sistemdeki tüm kullanıcıları listeler.
// Sadece sistemde test ve genel kontrol amaçlı kullanılabilir.
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Kullanıcı Güncelleme
// Bu endpoint bir kullanıcının bilgilerini günceller (kullanıcı adı ve e-posta).
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, email ,role } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: { username, email , role },
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(404).json({ error: 'User not found' });
    }
});

// Kullanıcı Silme
// Bu endpoint bir kullanıcıyı sistemden siler.
// Kullanıcıya ait tüm siparişler ve ilişkili veriler silinir.
// Siparişlerdeki ürünlerin stokları geri eklenir.
//@ts-ignore
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Kullanıcıya ait siparişleri al
        const orders = await prisma.order.findMany({
            where: { userId: Number(id) },
            include: { items: true },
        });

        // Siparişlerdeki ürünleri stoğa geri ekle
        for (const order of orders) {
            for (const item of order.items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity }, // Stokları artır
                    },
                });
            }
        }

        // Kullanıcıya ait tüm siparişleri sil
        await prisma.order.deleteMany({
            where: { userId: Number(id) },
        });

        // Kullanıcıyı sil
        await prisma.user.delete({ where: { id: Number(id) } });

        res.json({ message: 'User and related orders deleted successfully. Products restocked.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



export default router;
