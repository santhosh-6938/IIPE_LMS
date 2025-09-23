import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import classroomSlice from './slices/classroomSlice';
import taskSlice from './slices/taskSlice';
import notificationSlice from './slices/notificationSlice';
import courseContentSlice from './slices/courseContentSlice';
import adminSlice from './slices/adminSlice';
import attendanceSlice from './slices/attendanceSlice';
import adminTeacherAttendanceSlice from './slices/adminTeacherAttendanceSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    classroom: classroomSlice,
    task: taskSlice,
    notification: notificationSlice,
    courseContent: courseContentSlice,
    admin: adminSlice,
    attendance: attendanceSlice,
    adminTeacherAttendance: adminTeacherAttendanceSlice,
  },
});

export default store;