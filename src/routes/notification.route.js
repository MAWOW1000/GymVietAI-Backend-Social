import express from 'express';
import { 
  getNotifications,
  markAsRead,
  getUnreadCount,
  deleteNotification
} from '../controller/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationSchema } from '../middleware/validation.middleware';
import { z } from 'zod';

// Tạo schema riêng cho notification ID
const notificationIdSchema = z.object({
  id: z.string().uuid()
});

const router = express.Router();

// Get user's notifications
router.get(
  '/',
  authenticate,
  validate(
    paginationSchema.extend({
      unreadOnly: z.preprocess(
        // Chuyển đổi giá trị chuỗi thành boolean
        (val) => {
          if (typeof val === 'string') {
            return val.toLowerCase() === 'true';
          }
          return Boolean(val);
        },
        z.boolean().default(false)
      )
    }),
    'query'
  ),
  getNotifications
);

// Mark notifications as read
router.patch(
  '/read',
  authenticate,
  validate(
    z.object({
      ids: z.array(z.string().uuid()).optional()
    })
  ),
  markAsRead
);

// Get unread notification count
router.get(
  '/unread-count',
  authenticate,
  getUnreadCount
);

// Delete a notification
router.delete(
  '/:id',
  validate(notificationIdSchema, 'params'),
  authenticate,
  deleteNotification
);

export default router; 