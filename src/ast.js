const DataLib = require('./datalib');

class Fragment {
  toString(ctx=[]) {
    return "<Empty Fragment>";
  }
}

class Abstraction extends Fragment {
  /**
   * param here is the name of the variable of the abstraction. Body is the
   * subtree  representing the body of the abstraction.
   */
  constructor(astid, param, body, bodyid) {
    super();
    this.type = 'abs';
    if (typeof astid === 'object') {
      var data = astid;
      this.astid = (data.astid != null) ? data.astid : data.id;
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

class Application extends Fragment {
  /**
   * (lhs rhs) - left-hand side and right-hand side of an application.
   */
  constructor(astid, lhs, lhsid, rhs, rhsid) {
    super();
    this.type = 'app';
    if (typeof astid === 'object') {
      var data = astid;
      this.astid = (data.astid != null) ? data.astid : data.id;
      this.lhsid = (data.lhsid != null) ? data.lhsid : data.def1;
      this.rhsid = (data.rhsid != null) ? data.rhsid : data.def2;
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

class Identifier extends Fragment {
  /**
   * name is the string matched for this identifier.
   */
  constructor(value, astid, fn, fntype, fnclas, argCount, argTypes, mods, memo, rand, type) {
    super();
    this.type = 'free';
    if (typeof value === 'object') {
      var data = value;
      this.value = data.name;
      this.astid = (data.astid != null) ? data.astid : data.id;
      this.fn = data.fn;
      this.fntype = data.fntype;
      this.fnclas = data.fnclas;
      this.argCount = data.argn;
      if (data.argt == '"undefined"' || data.argt == 'undefined') this.argTypes = undefined;
      else this.argTypes = data.argt;
      this.args = (argCount == null) ? null : [];    
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

const isFragment = node => node instanceof Fragment || typeof node.type == 'string';
const isAbstraction = node => node instanceof Abstraction || (node.type == 'abs');
const isIdentifier = node => node instanceof Identifier || (node.type == 'id' || node.type == 'free'); // TODO: add field to free denoting name or value
const isApplication = node => node instanceof Application || (node.type == 'app');

const cast = (input) => {
  if (typeof input == 'string') {
    DataLib.readById(input, function (fragment) {
      return castAst(fragment);
    });
  } else {
    return castAst(input);
  }
}

const castAst = (input) => {
  if (isIdentifier(input)) {
    return new Identifier(input);
  } else if (isAbstraction(input)) {
    return new Abstraction(input);
  } else if (isApplication(input)) {
    return new Application(input);
  } else {
    return null;
  }
}

exports.cast = cast;
exports.isFragment = isFragment;
exports.isAbstraction = isAbstraction;
exports.isApplication = isApplication;
exports.isIdentifier = isIdentifier;
exports.Fragment = Fragment;
exports.Abstraction = Abstraction;
exports.Application = Application;
exports.Identifier = Identifier;
