const mongoose = require('mongoose');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/online_exam_test_db';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
