const mongoose = require('mongoose');

// Replace this with your MongoDB connection string
// This is the default string for a local MongoDB server
const dbUri = 'mongodb://localhost:27017/my-shop'; 

console.log('Attempting to connect to MongoDB...');

mongoose.connect(dbUri)
  .then(() => {
    console.log('✅ Connection successful!');
    console.log('MongoDB server is running and accessible.');
    mongoose.connection.close(); // Close the connection
  })
  .catch(err => {
    console.error('❌ Connection failed!');
    console.error('Error details:', err.message);
    console.log('Possible causes:');
    console.log('1. The MongoDB server is not running.');
    console.log('2. The connection string in the script is incorrect.');
    console.log('3. A firewall is blocking the connection to port 27017.');
  });