class Entry {
	constructor(data) {
	  this.id = data.id;
	  this.data = data;
	}
}

class Abstraction extends Entry {
	constructor(data) {
	  super(data);
	  this.name = data.name;
	  this.def2 = data.def2;
	  this.random = data.rand;
	}
}
class Application extends Entry {
	constructor(data) {
	  super(data);
	  this.def1 = data.def1;
	  this.def2 = data.def2;
	  this.invalid = data.invalid;
	}
}
class Identifier extends Entry {
	constructor(data) {
	  super(data);
	  this.index = data.indx;
	}
}
class FreeIdentifier extends Entry {
	constructor(data) {
	  super(data);
  	this.type = 'free';
  	this.name = data.name;
    this.astid = data.astid;
    this.fn = data.fn;
    this.fntype = data.fntype;
    this.fnclass = data.fnclas;
    this.argnum = data.argn;
    this.argtypes = data.argt;
    this.modules = data.mods;
    this.memoize = data.memo;
	  this.random = data.rand;
	}
}
class Substitution extends Entry {
	constructor(data) {
		super(data);
		this.styp = data.styp;
		this.def1 = data.def1;
		this.def2 = data.def2;
	}
}
class Association extends Entry {
	constructor(data) {
		super(data);
		this.srcid = data.srcid;
		this.dstid = data.dstid;
		this.assv = data.assv;
	}
}

exports.Entry = Entry;
exports.Abstraction = Abstraction;
exports.Application = Application;
exports.Identifier = Identifier;
exports.FreeIdentifier = FreeIdentifier;
exports.Substitution = Substitution;