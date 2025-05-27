const RechargePlan = require("../../../models/rechargePlan");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllRechargePlans = catchAsync(async (req, res) => {
  const { search} = req.query;

  let query = {};
  if (search) {
    query.$or = [
      { rechargeAmount: { $regex: search, $options: "i" } },
      { offerType: { $regex: search, $options: "i" } },
    ];
  }

  const rechargePlans = await RechargePlan.find(query)
    .sort({ rechargeAmount: -1 })
    

  res.status(200).json({
    status: true,
    message: "Recharge plans fetched successfully",
    data: rechargePlans,
  });
});