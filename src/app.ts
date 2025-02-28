import express from 'express';
import userRoutes from './modules/user';
import productRoutes from './modules/product';
import orderRoutes from './modules/order';
import categoryRoutes from './modules/category';

const app = express();
app.use(express.json());

// Rotaları bağla
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/categories', categoryRoutes);

export default app;
