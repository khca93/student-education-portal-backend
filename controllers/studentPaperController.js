const Student = require('../models/Student');
const ExamPaper = require('../models/ExamPaper');
const mongoose = require('mongoose');

/* ======================================
   SAVE PAPER
====================================== */
const savePaper = async (req, res) => {
  try {
    const studentId = req.user.id;
    const paperId = req.params.paperId;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      return res.status(400).json({ message: 'Invalid paper ID' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // ✅ Correct ObjectId comparison
    const alreadySaved = student.savedPapers.some(
      id => id.toString() === paperId
    );

    if (alreadySaved) {
      return res.json({
        success: true,
        message: 'Paper already saved'
      });
    }

    student.savedPapers.push(paperId);
    await student.save();

    res.json({
      success: true,
      message: 'Paper saved successfully'
    });
  } catch (err) {
    console.error('Save paper error:', err);
    res.status(500).json({ message: 'Error saving paper' });
  }
};

/* ======================================
   GET SAVED PAPERS
====================================== */
const getSavedPapers = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .populate({
        path: 'savedPapers',
        options: { sort: { createdAt: -1 } }
      });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      success: true,
      papers: student.savedPapers || []
    });
  } catch (err) {
    console.error('Get saved papers error:', err);
    res.status(500).json({ message: 'Error fetching saved papers' });
  }
};

module.exports = { savePaper, getSavedPapers };
