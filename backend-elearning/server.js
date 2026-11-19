const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const { routerCourse } = require('./routes/course.routes.js');
const { routerStudent } = require('./routes/student.routes.js');
const studentLearningRoutes = require('./routes/studentLearning.routes.js');
const { routerTeacher } = require('./routes/teacher.routes.js');
const { routes } = require('./routes/auth.routes.js');
const { routerProvince } = require('./routes/province.routes.js');
const { routerDistrict } = require('./routes/district.routes.js');
const multiLevelManagementRoutes = require('./routes/multiLevelManagement.routes.js');
const userManagementRoutes = require('./routes/userManagement.routes.js');
const roleManagementRoutes = require('./routes/roleManagement.routes.js');
const systemManagementRoutes = require('./routes/systemManagement.routes.js');
const userGroupManagementRoutes = require('./routes/userGroupManagement.routes.js');
const configurationManagementRoutes = require('./routes/configurationManagement.routes.js');
const systemLogManagementRoutes = require('./routes/systemLogManagement.routes.js');
const notificationManagementRoutes = require('./routes/notificationManagement.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const { verifyToken, authorize } = require('./middleware/auth.middleware.js');

dotenv.config();
const PORT = process.env.PORT || 3001;

connectDB();
//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/course', verifyToken, authorize('admin', 'course', 'teacher'), routerCourse);
app.use('/api/student', verifyToken, authorize('admin'), routerStudent);
app.use('/api/student-learning', studentLearningRoutes);
// Teacher profiles are managed by admins. Teachers use the dedicated learning API.
app.use('/api/teacher', verifyToken, authorize('admin'), routerTeacher);

app.use('/api/auth', routes);
app.use('/api/admin', verifyToken, authorize('admin'), adminRoutes);
const authAccess = [verifyToken, authorize('admin','directory')];
app.use('/api/province', ...authAccess, routerProvince);
app.use('/api/district', ...authAccess, routerDistrict);
const directoryAccess = [ verifyToken, authorize('admin', 'directory')];
app.use('/api/directory/multi-level-management', ...directoryAccess, multiLevelManagementRoutes);
app.use('/api/directory/user-management', ...directoryAccess, userManagementRoutes);
app.use('/api/directory/role-management', ...directoryAccess, roleManagementRoutes);
app.use('/api/directory/system-management', ...directoryAccess, systemManagementRoutes);
app.use('/api/directory/user-group-management', ...directoryAccess, userGroupManagementRoutes);
app.use('/api/directory/configuration-management', ...directoryAccess, configurationManagementRoutes);
app.use('/api/directory/system-log-management', ...directoryAccess, systemLogManagementRoutes);
app.use('/api/directory/notification-management', ...directoryAccess, notificationManagementRoutes);


app.get('/', (req, res) => {
    res.json({
        message: "Backend nodejs server run!",
    })
})

app.listen(PORT, () => {
    console.log(`Server running elearning ${PORT}`);
})
