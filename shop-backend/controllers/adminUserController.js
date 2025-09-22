const User = require('../models/User');
const Order = require('../models/Order');
const XLSX = require('xlsx');

// Admin: Get all users with order statistics
exports.getAllUsers = async (req, res, next) => {
  try {
    let { q, page = 1, pageSize = 20 } = req.query;
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 20;
    
    const filter = {};
    
    // Search in name, email, or phone
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    const skip = (page - 1) * pageSize;
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('name email phone status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();
    
    // Get order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Count total orders for this user
        const ordersCount = await Order.countDocuments({ 
          user: user._id, 
          status: { $in: ['paid', 'delivered', 'shipped'] } 
        });
        
        // Get last order date
        const lastOrder = await Order.findOne({ 
          user: user._id, 
          status: { $in: ['paid', 'delivered', 'shipped'] } 
        })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();
        
        return {
          ...user,
          ordersCount,
          lastOrderDate: lastOrder?.createdAt || null
        };
      })
    );
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.success({
      users: usersWithStats,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
    
  } catch (err) {
    next(err);
  }
};

// Admin: Update user status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.fail('وضعیت نامعتبر است', 400);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('name email status');
    
    if (!user) {
      return res.fail('کاربر یافت نشد', 404);
    }
    
    res.success({ user, message: 'وضعیت کاربر با موفقیت تغییر یافت' });
    
  } catch (err) {
    next(err);
  }
};

// Admin: Export users to Excel
exports.exportUsersExcel = async (req, res, next) => {
  try {
    // Get all users with basic info
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('name email phone createdAt status')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const ordersCount = await Order.countDocuments({ 
          user: user._id, 
          status: { $in: ['paid', 'delivered', 'shipped'] } 
        });
        
        const lastOrder = await Order.findOne({ 
          user: user._id, 
          status: { $in: ['paid', 'delivered', 'shipped'] } 
        })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();
        
        return {
          'نام و نام خانوادگی': user.name || '',
          'ایمیل': user.email || '',
          'شماره تماس': user.phone || '',
          'تعداد سفارشات': ordersCount,
          'آخرین سفارش': lastOrder?.createdAt 
            ? new Date(lastOrder.createdAt).toLocaleDateString('fa-IR')
            : 'ندارد',
          'تاریخ عضویت': user.createdAt 
            ? new Date(user.createdAt).toLocaleDateString('fa-IR')
            : '',
          'وضعیت': user.status === 'active' ? 'فعال' : 'غیرفعال'
        };
      })
    );
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(usersWithStats);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // نام
      { wch: 25 }, // ایمیل  
      { wch: 15 }, // تلفن
      { wch: 12 }, // تعداد سفارشات
      { wch: 15 }, // آخرین سفارش
      { wch: 15 }, // تاریخ عضویت
      { wch: 10 }  // وضعیت
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'مشتریان');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const today = new Date().toISOString().split('T')[0];
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="customers-${today}.xlsx"`
    });
    
    res.send(buffer);
    
  } catch (err) {
    next(err);
  }
};