import { Router } from 'express';
import { authenticateToken, isAdmin } from '../../middleware/auth';
import ordersRouter from './orders';
import usersRouter from './users';
import returnsRouter from './returns';
import shippingRouter from './shipping';
import taxRouter from './tax';
import couponsRouter from './coupons';
import ratingsRouter from './ratings';

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

router.use('/orders', ordersRouter);
router.use('/users', usersRouter);
router.use('/returns', returnsRouter);
router.use('/shipping', shippingRouter);
router.use('/tax', taxRouter);
router.use('/coupons', couponsRouter);
router.use('/ratings', ratingsRouter);

export default router; 