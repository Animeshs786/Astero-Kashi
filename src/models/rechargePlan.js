const mongoose = require("mongoose");

const rechargePlanSchema = new mongoose.Schema({
  rechargeAmount:{
    type:Number,
    required:true
  },
  offerType:{
    type:String,
    enum:["fixed","percentage"],
    default:"fixed"
  },
  offerValue: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
 
});

const RechargePlan= mongoose.model("RechargePlan", rechargePlanSchema);
module.exports = RechargePlan;