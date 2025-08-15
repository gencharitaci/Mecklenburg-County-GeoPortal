/**
 * @param {number} num
 */
function formatCommas(num, decimals = 0) {
  if (num === null || isNaN(num)) return "N/A";
  return parseFloat(`${num}`).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
}

/**
 * @param {number} num
 */
function formatMoney(num) {
  if (num === null || isNaN(num)) return "N/A";
  return parseFloat(`${num}`).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * @param {string | number | Date} dateString
 */
function formatDate(dateString) {
  let date = new Date(dateString);
  return date.toLocaleDateString("en-US");
}

/**
 * @param {number} n
 */
function isNumeric(n) {
  return !isNaN(parseFloat(`${n}`)) && isFinite(n)
}

/**
 * @param {number} n
 */
function formatNumber(n, format = null, decimals = 0) {
  if (!isNumeric(n)) return "N/A";

  if (format === "money") {
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n)
  }
  if (format === "percent") {
    return Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: 1
    }).format(n / 100)
  }
  if (format === "short") {
    return Intl.NumberFormat('en-US', { notation: "compact",  maximumFractionDigits: 1}).format(n)
  }

  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals
  }).format(n)
}

export { formatCommas, formatMoney, formatDate, formatNumber, isNumeric };
