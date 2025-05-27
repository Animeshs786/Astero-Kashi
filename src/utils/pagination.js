const pagination = async (
  CurrentPage = 1,
  currentLimit = 10,
  Model,
  role = null,
  filter = {}
) => {
  const page = Number(CurrentPage);
  const limit = Number(currentLimit);
  let totalResult;
  const skip = (page - 1) * limit;

  if (role) {
    totalResult = await Model.countDocuments({ role });
  } else {
    totalResult = await Model.countDocuments(filter);
  }

  const totalPage = Math.ceil(totalResult / limit);
  return { limit, skip, totalResult, totalPage };
};

module.exports = pagination;
