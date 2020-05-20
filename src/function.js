class StoredFunction {
  /**
   * memoize: boolean - should return values be stored or not
   * type: javascript type (or 'promise')
   * klass: if type=='object' then the name of the class goes here. must exist in Class database
   *        if type=='promise' then the js type of the eventual value goes here, or the class name if desired (js type 'object' is assumed)
   * argTypes: array of javascript types. 
   *           may be Application, Identifier, Abstraction from ast.js
   * modules: array of 'Module' names which are already stored in the 'Module' database
   *          modules will be provided to the functionBody by the construct
   * functionBody: function body in javascript as 
   *               may refer to provided context object 'CTX'.
   *               may be data (with zero argTypes)
   *
   *               CTX.args: access arguments array for function instance (already typechecked against argTypes)
   *               CTX.fn(functionName): access named function (free identifier) by name. 
   *                                     invoke with CTX.fn().call() CTX.fn().apply() or use as data
   */
  constructor(memoize, type, klass, argTypes, modules, functionBody, functionType) {
    this.memoize = memoize;
    this.type = type;
    this.klass = klass;
    this.argTypes = argTypes;
    this.modules = modules;
    this.functionBody = functionBody;
  }

  toString() {
    return `(κ ${this.memoize}. ${this.type}. ${this.klass}. ${this.argTypes}. ${this.functionBody})`;
  }
}

exports.StoredFunction = StoredFunction;