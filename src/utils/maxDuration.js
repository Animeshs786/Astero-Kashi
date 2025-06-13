exports.maxDuration = (
  userWalletBalance = 50,
  astrologerRatePerMinute = 25
) => {
  const maxDuration = Math.floor(userWalletBalance / astrologerRatePerMinute);
  return maxDuration;
};
