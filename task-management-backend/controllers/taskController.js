// controllers/taskController.js
const Task = require('../models/Task');
const ExcelJS = require('exceljs');

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Public/Private (based on your requirement)
 */
const createTask = async (req, res) => {
  try {
    const { author, division, task, dateOfTask, status, priority } = req.body;

    // Create new task
    const newTask = new Task({
      author,
      division,
      task,
      dateOfTask,
      status: status || 'pending',
      priority: priority || 'medium',
      createdBy: req.user ? req.user._id : null
    });

    await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all tasks with optional filters
 * @route   GET /api/tasks
 * @access  Public/Private
 */
const getAllTasks = async (req, res) => {
  try {
    const { author, division, status, priority, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    
    if (author) filter.author = new RegExp(author, 'i');
    if (division) filter.division = new RegExp(division, 'i');
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (startDate || endDate) {
      filter.dateOfTask = {};
      if (startDate) filter.dateOfTask.$gte = new Date(startDate);
      if (endDate) filter.dateOfTask.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get tasks with pagination
    const tasks = await Task.find(filter)
      .sort({ dateOfTask: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    // Get total count for pagination
    const totalTasks = await Task.countDocuments(filter);

    res.json({
      success: true,
      count: tasks.length,
      total: totalTasks,
      page: parseInt(page),
      totalPages: Math.ceil(totalTasks / parseInt(limit)),
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Public/Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    const { author, division, task, dateOfTask, status, priority } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        author,
        division,
        task,
        dateOfTask,
        status,
        priority,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Download all tasks as Excel file
 * @route   GET /api/tasks/download/excel
 * @access  Public/Private
 */
const downloadTasksExcel = async (req, res) => {
  try {
    const { author, division, status, priority, startDate, endDate } = req.query;

    // Build filter object (same as getAllTasks)
    const filter = {};
    
    if (author) filter.author = new RegExp(author, 'i');
    if (division) filter.division = new RegExp(division, 'i');
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (startDate || endDate) {
      filter.dateOfTask = {};
      if (startDate) filter.dateOfTask.$gte = new Date(startDate);
      if (endDate) filter.dateOfTask.$lte = new Date(endDate);
    }

    // Get all tasks (no pagination for export)
    const tasks = await Task.find(filter)
      .sort({ dateOfTask: -1, createdAt: -1 })
      .populate('createdBy', 'name email');

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 25 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Division', key: 'division', width: 20 },
      { header: 'Task', key: 'task', width: 50 },
      { header: 'Date of Task', key: 'dateOfTask', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    tasks.forEach(task => {
      worksheet.addRow({
        _id: task._id.toString(),
        author: task.author,
        division: task.division,
        task: task.task,
        dateOfTask: task.dateOfTask ? new Date(task.dateOfTask).toLocaleDateString() : '',
        status: task.status,
        priority: task.priority,
        createdBy: task.createdBy ? task.createdBy.name : 'N/A',
        createdAt: new Date(task.createdAt).toLocaleString(),
        updatedAt: new Date(task.updatedAt).toLocaleString()
      });
    });

    // Apply borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'J1'
    };

    // Set response headers
    const fileName = `tasks_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Download Excel error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error generating Excel file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Public/Private
 */
const getTaskStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const cancelledTasks = await Task.countDocuments({ status: 'cancelled' });

    // Get tasks by division
    const tasksByDivision = await Task.aggregate([
      {
        $group: {
          _id: '$division',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get tasks by priority
    const tasksByPriority = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        cancelled: cancelledTasks,
        byDivision: tasksByDivision,
        byPriority: tasksByPriority
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  downloadTasksExcel,
  getTaskStats
};
