import { Notification, Profile } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * Get notifications for authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNotifications = async (req, res) => {
  try {
    const { profileId } = req.user;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query
    const where = {
      recipientId: profileId
    };
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    // Get notifications
    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        {
          model: Profile,
          as: 'sender',
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'isVerified']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications'
    });
  }
};

/**
 * Mark notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markAsRead = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { profileId } = req.user;
    const { ids } = req.body; // Optional array of notification IDs
    
    const where = {
      recipientId: profileId,
      isRead: false
    };
    
    // If specific IDs provided, only mark those as read
    if (ids && ids.length > 0) {
      where.id = { [Op.in]: ids };
    }
    
    // Mark notifications as read
    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where, transaction }
    );
    
    // Commit transaction
    await transaction.commit();
    
    return res.status(200).json({
      status: 'success',
      message: `${updatedCount} notifications marked as read`,
      data: {
        updatedCount
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to mark notifications as read'
    });
  }
};

/**
 * Get unread notification count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUnreadCount = async (req, res) => {
  try {
    const { profileId } = req.user;
    
    // Count unread notifications
    const count = await Notification.count({
      where: {
        recipientId: profileId,
        isRead: false
      }
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        count
      }
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get unread notification count'
    });
  }
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { profileId } = req.user;
    
    // Find notification
    const notification = await Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    // Check if user owns the notification
    if (notification.recipientId !== profileId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this notification'
      });
    }
    
    // Delete notification
    await notification.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification'
    });
  }
}; 