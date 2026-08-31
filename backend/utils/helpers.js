function paginate(query, page = 1, limit = 10) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
function timeSlots() {
  return ["09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00"];
}
module.exports = { paginate, timeSlots };
