const DataLib = require('./datalib');
class Abstraction {
  /**
   * param here is the name of the variable of the abstraction. Body is the
   * subtree  representing the body of the abstraction.
   */
  constructor(astid, param, body, bodyid) {
    if (typeof astid === 'object') {
      var data = astid;
      this.astid = data.id;
      this.param = data.name;
      this.body = null;
      this.bodyid = data.def2;
    } else {
      this.astid = astid;
      this.param = param;
      this.body = body;
      this.bodyid = bodyid;
    }
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
    if (typeof astid === 'object') {
      var data = astid;
      this.astid = data.id;
      this.lhsid = data.definition1;
      this.rhsid = data.definition2;
      this.lhs = null;
      this.rhs = null;
    } else {
      this.astid = astid;
      this.lhs = lhs;
      this.rhs = rhs;
      this.lhsid = lhsid;
      this.rhsid = rhsid;
    }
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
      this.argCount = data.argn;
      try {
        if (data.argt == '"undefined"' || data.argt == 'undefined') this.argTypes = undefined;
        else this.argTypes = JSON.parse(data.argt);
      } catch (err) {
        console.error('Problem parsing '+data.id+' argTypes "' + data.argt + '", message: '+ err);
        console.error('data: '+JSON.stringify(data,null,4));
      }
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
