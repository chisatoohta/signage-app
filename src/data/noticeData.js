const notices = {
  please: {
    title: "🎁 新規会員募集中！",
    message: "入会無料！その場で登録できます。",
  },

  pearl: {
    title: "🧥 冬物クリーニング",
    message: "ダウン・毛布の早割実施中！",
  },
};

export function getNotice(storeCode) {
  return notices[storeCode] || notices.please;
}