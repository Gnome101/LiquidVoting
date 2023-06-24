const { BigNumber } = require("bignumber.js");
const Q192 = BigNumber(2).exponentiatedBy(192);
module.exports = {
  sleep: (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  calculateSqrtPriceX96: (price, token0Dec, token1Dec) => {
    price = BigNumber(price).shiftedBy(token1Dec - token0Dec);
    ratioX96 = price.multipliedBy(Q192);
    sqrtPriceX96 = ratioX96.sqrt();
    return sqrtPriceX96;
  },

  calculatePriceFromX96: (sqrtPriceX96, token0Dec, token1Dec) => {
    let ratioX96 = BigNumber(sqrtPriceX96).exponentiatedBy(2);
    //Get token0 by dividing ratioX96 / Q192 and shifting decimal
    //values of the coins to put in human readable format.
    let price = ratioX96.dividedBy(Q192);
    price = price.shiftedBy(token0Dec - token1Dec);
    return price;
  },

  getNearestUsableTick: (currentTick, space) => {
    // 0 is always a valid tick
    if (currentTick == 0) {
      return 0;
    }
    // Determines direction
    direction = currentTick >= 0 ? 1 : -1;
    // Changes direction
    currentTick *= direction;
    // Calculates nearest tick based on how close the current tick remainder is to space / 2
    nearestTick =
      currentTick % space <= space / 2
        ? currentTick - (currentTick % space)
        : currentTick + (space - (currentTick % space));
    // Changes direction back
    nearestTick *= direction;

    return nearestTick;
  },
};
