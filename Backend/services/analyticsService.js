import * as analyticsModel from '../models/analyticsModel.js';

const currentYearMonth = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const getSalesSummary = async (year, month) => {
  const y = Number(year) || currentYearMonth().year;
  const m = Number(month) || currentYearMonth().month;

  // current and previous month
  let prevYear = y, prevMonth = m - 1;
  if (prevMonth < 1) { prevMonth = 12; prevYear = y - 1; }

  const [current, previous] = await Promise.all([
    analyticsModel.fetchRevenueSummary(y, m),
    analyticsModel.fetchRevenueSummary(prevYear, prevMonth),
  ]);

  const revenueDiff = Number(current.revenue) - Number(previous.revenue);
  const unitsDiff   = Number(current.unitsSold) - Number(previous.unitsSold);

  return {
    year: y,
    month: m,
    revenue: Number(current.revenue),
    unitsSold: Number(current.unitsSold),
    revenuePrevious: Number(previous.revenue),
    unitsSoldPrevious: Number(previous.unitsSold),
    revenueDiff,
    unitsDiff,
    revenueChangePercent: previous.revenue > 0
      ? Math.round((revenueDiff / previous.revenue) * 100)
      : null,
    unitsChangePercent: previous.unitsSold > 0
      ? Math.round((unitsDiff / previous.unitsSold) * 100)
      : null,
  };
};

export const getSalesTrend = async (year, month) => {
  const y = Number(year) || currentYearMonth().year;
  const m = Number(month) || currentYearMonth().month;

  let prevYear = y, prevMonth = m - 1;
  if (prevMonth < 1) { prevMonth = 12; prevYear = y - 1; }

  const [currentDays, previousDays] = await Promise.all([
    analyticsModel.fetchDailyRevenue(y, m),
    analyticsModel.fetchDailyRevenue(prevYear, prevMonth),
  ]);

  return { year: y, month: m, current: currentDays, previous: previousDays };
};

export const getOrderStatusCounts = async () => {
  const rows = await analyticsModel.fetchOrderStatusCounts();
  const result = { Pending: 0, Completed: 0, Cancelled: 0 };
  for (const r of rows) {
    if (r.status in result) result[r.status] = Number(r.count);
  }
  return result;
};

export const getTopProducts = async () => {
  return await analyticsModel.fetchTopProducts(5);
};

export const getProductAnalytics = async () => {
  return await analyticsModel.fetchProductAnalytics();
};
