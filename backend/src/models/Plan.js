const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  planType: { type: String, enum: ['monthly', 'annual'], required: true, unique: true },
  mpPlanId: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  frequency: { type: Number, required: true },
  frequencyType: { type: String, enum: ['months', 'years'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Plan', PlanSchema);
