export var SETTINGS = {
	adapter: 'suit'
};

var moduleAdapters = {

	bem: {

		init: function(name) {

			return name.replace(/([A-Z])/g, ' $1')
				.replace(/[_-\s]+/g, ' ')
				.trim()
				.replace(/\s/g, '-')
				.toLowerCase();
		},

		mod: function(root, mod) {

			return root + '--' + this.init(mod);
		},

		state: function(root, state) {

			return this.mod(root, state);
		},
		
		child: function(root, child) {

			return root + '__' + this.init(child);
		}
	},

	bootstrap: {

		init: function(name) {

			return name.replace(/([A-Z])/g, ' $1')
				.replace(/[_-\s]+/g, ' ')
				.trim()
				.replace(/\s/g, '-')
				.toLowerCase();
		},

		mod: function(root, mod) {

			return root + '-' + this.init(mod);
		},

		state: function(root, state) {

			return this.mod(root, state);
		},
		
		child: function(root, child) {

			return this.mod(root, child);
		}
	},

	suit: {

		init: function(name) {

			let arr = name.replace(/([A-Z])/g, ' $1')
				.replace(/[_-\s]+/g, ' ')
				.trim()
				.split(' ');

			return arr
				.map(word =>
					word.replace(/^(.)/, c =>
						c.toUpperCase()
					)
				)
				.join('');
		},

		mod: function(root, mod) {

			return root + '--' + this.init(mod).replace(/^(.)/, c => c.toLowerCase());
		},

		state: function(root, state) {

			return 'is-' + this.init(state).replace(/^(.)/, c => c.toLowerCase());
		},
		
		child: function(root, child) {

			return root + '-' + this.init(child).replace(/^(.)/, c => c.toLowerCase());
		}
	}
};

function adapter() {
	return typeof SETTINGS.adapter === 'string' ? moduleAdapters[SETTINGS.adapter] : SETTINGS.adapter;
}

function namespace(ns) {
	return ns ? ( ns.toLowerCase().replace(/[\s-]+/g, '-') + '-' ) : '';
}

function toClassName(struct, ns) {

	let _adptr = adapter();
	let block = struct.elements[0];
	let child = struct.elements[struct.elements.length - 1];
	let rootName = namespace(ns) + _adptr.init(block.name);

	if (child !== block) {
		rootName = _adptr.child(rootName, child.name);
		block = child;
	}

	let classList = [rootName];

	block.modifiers.forEach(mod => classList.push(_adptr.mod(rootName, mod)));
	block.states.forEach(state => classList.push(_adptr.state(rootName, state)));

	return classList.join(' ');
}

function toSelector(struct, ns) {

	let block = struct.block;
	let child = struct.child;
	let selector = [];

	if (!child || block.modifiers.length || block.states.length) {
		
		selector.push('.' + toClassName({block: block}, ns).replace(/\s/g, '.'));
	}
	

	if (child) {

		selector.push('.' + toClassName(struct, ns).replace(/\s/g, '.'));
	}

	return selector.join(' ');
}

function addToType(type, name) {
	let struct = new Struct(this.elements);
	struct.elements[struct.elements.length - 1][type].push(name);
	return struct;
}

function Struct(elements) {
	this.elements = elements.map(elem => ({
		name: elem.name,
		modifiers: elem.modifiers.slice(),
		states: elem.states.slice()
	}));
}

export default class Chaos {

	constructor(name, ns = '') {

		this.namespace = ns;

		if (name instanceof Struct) {
			this.struct = name;
		}
		else {
			this.struct = new Struct({
				name: name,
				modifiers: [],
				states: []
			});
		}
	}

	mod(name) {
		let struct = addToType.call(this.struct, 'modifiers', name);
		return new Chaos(struct, this.namespace);
	}

	state(name) {
		let struct = addToType.call(this.struct, 'states', name)
		return new Chaos(struct, this.namespace);
	}

	child(name) {
		let elements = this.struct.elements.slice()
		elements.push({
			name: name,
			modifiers: [],
			states: []
		})
		return new Chaos(new Struct(elements), this.namespace);
	}

	toClassName() {
		return toClassName(this.struct, this.namespace);
	}

	toSelector() {
		return toSelector(this.struct, this.namespace);
	}

	query(scope = document) {
		return scope.querySelectorAll(this.toSelector());
	}
}
