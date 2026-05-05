class IntlMessageFormat {
  constructor(message) {
    this.message = message;
  }
  format(values) {
    let result = this.message;
    for (const [key, value] of Object.entries(values || {})) {
      result = result.replace(`{${key}}`, String(value));
    }
    return result;
  }
}
module.exports = {
  default: IntlMessageFormat,
  __esModule: true,
};
