let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client joins examination monitoring room (for faculty/proctors)
    socket.on('join:exam_monitoring', (examId) => {
      if (examId) {
        socket.join(`exam:monitoring:${examId}`);
      }
    });

    socket.on('leave:exam_monitoring', (examId) => {
      if (examId) {
        socket.leave(`exam:monitoring:${examId}`);
      }
    });

    // Student joins personal notification room
    socket.on('join:student_room', (studentId) => {
      if (studentId) {
        socket.join(`student:${studentId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean up connection
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

const emitExamEvent = (examId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`exam:monitoring:${examId}`).emit(event, data);
  }
};

const notifyStudent = (studentId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`student:${studentId}`).emit(event, data);
  }
};

const notifyGroup = (groupId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`group:${groupId}`).emit(event, data);
  }
};

const broadcastNotification = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitExamEvent,
  notifyStudent,
  notifyGroup,
  broadcastNotification
};
