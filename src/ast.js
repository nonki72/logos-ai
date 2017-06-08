const DataLib = require('./datalib');
class Abstraction {
  /**
   * param here is the name of the variable of the abstraction. Body is the
   * subtree  representing the body of the abstraction.
   */
  constructor(param, body) {
    this.param = param;
    this.body = body;
  }

  toString(ctx=[]) {
    return `(λ${this.param}. ${this.body.toString([this.param].concat(ctx))})`;
  }
}

class Application {
  /**
   * (lhs rhs) - left-hand side and right-hand side of an application.
   */
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toString(ctx) {
    return `${this.lhs.toString(ctx)} ${this.rhs.toString(ctx)}`;
  }
}

class Identifier {
  /**
   * name is the string matched for this identifier.
   */
  constructor(value, astid, fn, fntype, argCount, argTypes) {
    this.value = value;
    this.astid = astid;
    this.fn = fn;
    this.fntype = fntype;
    this.argCount = argCount;
    this.argTypes = argTypes;
    this.args = [];
  }

  toString(ctx) {
    if (typeof ctx === 'undefined') {
      return this.value;
    } else {
      return ctx[this.value];
    }
  }
}

exports.Abstraction = Abstraction;
exports.Application = Application;
exports.Identifier = Identifier;
