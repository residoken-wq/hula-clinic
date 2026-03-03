export const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);
