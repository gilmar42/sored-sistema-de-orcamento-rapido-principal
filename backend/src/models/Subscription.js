const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mpSubscriptionId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['authorized', 'paused', 'cancelled', 'pending', 'failure'], required: true },
  planType: { type: String, enum: ['monthly', 'annual'], required: true },
  nextBilling: { type: Date },
  gracePeriodUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);