class Exception {
    // eslint-disable-next-line no-unused-vars
    constructor(errorName = 'GeneralError', params = null, errorStack = null) {
      this.code = global.EXCEPTIONS[errorName]['code'];
      this.message = global.EXCEPTIONS[errorName]['message'];
      this.name = global.EXCEPTIONS[errorName]['name'];
      this.httpStatusCode = global.EXCEPTIONS[errorName]['http_code'];
      this.stackTrace = errorStack != null ? errorStack : new Error().stack;
  
      if (params && typeof params === 'string') {
        this.message = params;
      } else if (params && typeof params === 'object') {
        const keys = Object.keys(params);
        for (let i = 0, n = keys.length; i < n; i++) {
          const regExp = new RegExp('{' + keys[i] + '}', 'g');
          this.message = this.message.replace(regExp, params[keys[i]]);
        }
      }
    }
  
    getExceptionMessage() {
      return {
        'Code': this.code,
        'Name': this.name,
        'Message': this.message,
        'StackTrace': this.stackTrace
      };
    }
  
  }
  
  module.exports = Exception;
  