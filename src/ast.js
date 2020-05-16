const DataLib = require('./datalib');
class Abstraction {
  /**
   * param here is the name of the variable of the abstraction. Body is the
   * subtree  representing the body of the abstraction.
   */
  constructor(astid, param, body, bodyid) {
    this.astid = astid;
    this.param = param;
    this.body = body;
    this.bodyid = bodyid;
  }

  toString(ctx=[]) {
    return `(λ${this.param}. ${this.body.toString([this.param].concat(ctx))})`;
  }
}

class Application {
  /**
   * (lhs rhs) - left-hand side and right-hand side of an application.
   */
  constructor(astid, lhs, lhsid, rhs, rhsid) {
    this.astid = astid;
    this.lhs = lhs;
    this.rhs = rhs;
    this.lhsid = lhsid;
    this.rhsid = rhsid;
  }

  toString(ctx) {
    return `${this.lhs.toString(ctx)} ${this.rhs.toString(ctx)}`;
  }
}

class Identifier {
  /**
   * name is the string matched for this identifier.
   */
  constructor(value, astid, fn, fntype, fnclas, argCount, argTypes, mods, memo, rand) {
    if (typeof value === 'object') {
      var data = value;
      this.value = data.name;
      this.astid = data.id;
      this.fn = data.fn;
      this.fntype = data.fntype;
      this.fnclas = data.fnclas;
      this.argCount = data.argc;
      this.argTypes = data.argt;
      this.args = [];    

      this.mods = data.mods;
      this.memo = data.memo;
      this.rand = data.rand;
    } else {
      this.value = value;
      this.astid = astid;
      this.fn = fn;
      this.fntype = fntype;
      this.fnclas = fnclas;
      this.argCount = argCount;
      this.argTypes = argTypes;
      this.args = [];
      this.mods = mods;
      this.memo = memo;
      this.rand = rand;
    }
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
