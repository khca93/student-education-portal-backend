// Add at the top with other imports
const examPaperRoutes = require('./routes/examPapers');
const path = require('path');

// Add this AFTER other middleware but BEFORE routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add this with other route uses (around line where other routes are defined)
app.use('/api/exam-papers', examPaperRoutes);