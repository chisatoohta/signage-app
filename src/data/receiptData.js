const receiptDataByStore = {
  please: {
    receiptNumber: "P-1025",
    items: [
  { name: "Yシャツ", count: 2, unitPrice: 400 },
  { name: "スラックス", count: 1, unitPrice: 680 },
],
    itemCount: 3,
    totalAmount: 1480,
    pickupDate: "7/13 18:00",
  },

  pearl: {
    receiptNumber: "R-2048",
    items: [
  { name: "ワンピース", count: 1, unitPrice: 1300 },
  { name: "ジャケット", count: 1, unitPrice: 1000 },
],
    itemCount: 2,
    totalAmount: 2300,
    pickupDate: "7/14 17:00",
  },

  default: {
    receiptNumber: "----",
    items: [],
    itemCount: 0,
    totalAmount: 0,
    pickupDate: "未設定",
  },
};

export const getReceiptData = (storeCode) => {
  const normalizedStoreCode = storeCode?.toLowerCase().trim();

  return (
    receiptDataByStore[normalizedStoreCode] ||
    receiptDataByStore.default
  );
};