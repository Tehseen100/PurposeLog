import { Task } from "../models/task.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc   Create a new task
// @route  POST /api/v1/tasks
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  if (!title?.trim() || title.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Task title of atleast 3 characters is required",
    });
  }

  const validStatuses = ["todo", "in-progress", "done"];
  const validPriorities = ["low", "medium", "high"];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: "Invalid priority value",
    });
  }

  if (dueDate) {
    const parsedDate = new Date(dueDate);

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD or ISO format.",
      });
    }

    if (parsedDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be a future date",
      });
    }
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    owner: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: { task },
  });
});

// @desc   Get all tasks (with filters, search, sort, pagination)
// @route  GET /api/v1/tasks
export const getAllTasks = asyncHandler(async (req, res) => {
  const filters = { owner: req.user._id };

  // filter by status
  if (req.query.status) filters.status = req.query.status;

  // filter by priority
  if (req.query.priority) filters.priority = req.query.priority;

  // search
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    filters.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  // sorting
  let sortOptions = { createdAt: -1 }; // newest first
  if (req.query.sort) {
    sortOptions = { [req.query.sort]: req.query.order === "asc" ? 1 : -1 };
  }

  // pagination
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const tasks = await Task.find(filters)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalTask = await Task.countDocuments(filters);
  const totalPages = Math.ceil(totalTask / limit);

  res.status(200).json({
    success: true,
    message: "All tasks fetched successfully",
    data: { tasks },
    meta: {
      totalTask,
      page,
      limit,
      totalPages,
    },
  });
});

// @desc   Get a task by id
// @route  GET /api/v1/tasks/:id
export const getTaskById = asyncHandler(async (req, res) => {
  const taskId = req.params.id;

  const task = await Task.findOne({
    _id: taskId,
    owner: req.user._id,
  }).lean();

  if (!task) {
    return res.status(404).json({ success: false, message: "Task not found" });
  }

  res.status(200).json({
    success: true,
    message: "Task fetched successfully",
    data: { task },
  });
});

// @desc   Update a task
// @route  PUT /api/v1/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, dueDate } = req.body;

  const updatedFields = {};

  if (title) {
    if (!title?.trim() || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Task title of at least 3 characters is required",
      });
    }
    updatedFields.title = title;
  }

  if (description) updatedFields.description = description;

  if (status) {
    const validStatuses = ["todo", "in-progress", "done"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }
    updatedFields.status = status;
  }

  if (priority) {
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value",
      });
    }
    updatedFields.priority = priority;
  }

  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD or ISO format.",
      });
    }
    if (parsedDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be a future date",
      });
    }
    updatedFields.dueDate = dueDate;
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, owner: req.user._id },
    updatedFields,
    { new: true, runValidators: true }
  );

  if (!updatedTask) {
    return res.status(404).json({ success: false, message: "Task not found" });
  }

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: { task: updatedTask },
  });
});

// @desc   Delete a task
// @route  DELETE /api/v1/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;

  const deletedTask = await Task.findOneAndDelete({
    _id: taskId,
    owner: req.user._id,
  });
  if (!deletedTask) {
    return res.status(404).json({
      success: false,
      message: "Task not found or you are not authorized to delete it",
    });
  }

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
    data: { task: deletedTask },
  });
});
