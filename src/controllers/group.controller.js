const AcademicGroup = require('../models/AcademicGroup');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const createGroup = async (req, res, next) => {
  try {
    const { name, code, department, semester, academicYear, description } = req.body;

    const existingGroup = await AcademicGroup.findOne({ code });
    if (existingGroup) {
      throw new ApiError(400, 'Academic group with this code already exists');
    }

    const group = await AcademicGroup.create({
      name,
      code,
      department,
      semester,
      academicYear,
      description
    });

    res.status(201).json(new ApiResponse(201, group, 'Academic group created successfully'));
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const { department, semester, academicYear } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    const groups = await AcademicGroup.find(filter).sort({ name: 1 });
    res.status(200).json(new ApiResponse(200, groups, 'Groups retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const group = await AcademicGroup.findById(req.params.groupId);
    if (!group) {
      throw new ApiError(404, 'Academic group not found');
    }
    res.status(200).json(new ApiResponse(200, group, 'Group retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const group = await AcademicGroup.findByIdAndUpdate(
      req.params.groupId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!group) {
      throw new ApiError(404, 'Academic group not found');
    }
    res.status(200).json(new ApiResponse(200, group, 'Group updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const group = await AcademicGroup.findByIdAndDelete(req.params.groupId);
    if (!group) {
      throw new ApiError(404, 'Academic group not found');
    }
    res.status(200).json(new ApiResponse(200, null, 'Group deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup
};
