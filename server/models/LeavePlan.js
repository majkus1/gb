const mongoose = require("mongoose");

const leavePlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  firstName: { type: String },
  lastName: { type: String },
  date: { type: String, required: true },
});

const LeavePlan = mongoose.model("LeavePlan", leavePlanSchema);

module.exports = LeavePlan;
