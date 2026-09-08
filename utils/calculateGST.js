export const roundMoney = (value) => {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
};


export const getEffectiveGstRate = (dish, hotel) => {
  // GST globally disabled
  if (!hotel?.gstEnabled) {
    return 0;
  }

  // Dish-specific GST
  if (
    dish?.gst !== null &&
    dish?.gst !== undefined &&
    dish?.gst !== ""
  ) {
    const dishRate = Number(dish.gst);

    if (
      Number.isFinite(dishRate) &&
      dishRate >= 0 &&
      dishRate <= 100
    ) {
      return dishRate;
    }
  }

  // Otherwise use hotel default
  const hotelRate = Number(
    hotel?.gstPercentage || 0
  );

  if (
    Number.isFinite(hotelRate) &&
    hotelRate >= 0
  ) {
    return hotelRate;
  }

  return 0;
};


export const calculateGST = ({
  amount,
  rate,
}) => {
  const taxableAmount = Number(amount || 0);
  const gstRate = Number(rate || 0);

  return roundMoney(
    (taxableAmount * gstRate) / 100
  );
};