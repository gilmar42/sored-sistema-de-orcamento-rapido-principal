const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  // Outros campos do usuário conforme necessário
});

module.exports = mongoose.model('User', UserSchema);