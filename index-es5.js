var SETTINGS = {
	adapter: 'suit',
	namespace: null
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

			var arr = name.replace(/([A-Z])/g, ' $1')
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

function ns() {
	return SETTINGS.namespace ? SETTINGS.namespace + '-' : '';
}

function toClassName(struct) {

	var _adptr = adapter();
	var block = struct.block;
	var child = struct.child;
	var rootName = ns() + _adptr.init(block.name);

	if (child) {
		rootName = _adptr.child(rootName, child.name);
		block = child;
	}

	var classList = [rootName];

	block.modifiers.forEach(mod => classList.push(_adptr.mod(rootName, mod)));
	block.states.forEach(state => classList.push(_adptr.state(rootName, state)));

	return classList.join(' ');
}

function toSelector(struct) {

	var block = struct.block;
	var child = struct.child;
	var selector = [];

	if (!child || block.modifiers.length || block.states.length) {
		
		selector.push('.' + toClassName({block: block}).replace(/\s+/g, '.'));
	}
	

	if (child) {

		selector.push('.' + toClassName(struct).replace(/\s+/g, '.'));
	}

	return selector.join(' ');
}

function addToType(type, name) {
	var struct = new Struct(this.block, this.child);
	struct[struct.child ? 'child' : 'block'][type].push(name);
	return struct;
}

function Struct(block, child) {
	this.block = {
		name: block.name,
		modifiers: block.modifiers.slice(),
		states: block.states.slice()
	};
	this.child = !child ? false : {
		name: child.name,
		modifiers: child.modifiers.slice(),
		states: child.states.slice()
	};
}

function NameBuilder(name) {

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

NameBuilder.prototype = {

	mod: function(name) {
		var struct = addToType.call(this.struct, 'modifiers', name);
		return new NameBuilder(struct);
	},

	state: function(name) {
		var struct = addToType.call(this.struct, 'states', name)
		return new NameBuilder(struct);
	},

	child: function(name) {
		var struct = new Struct(this.struct.block, {
			name: name,
			modifiers: [],
			states: []
		});
		return new NameBuilder(struct);
	},

	toClassName: function() {
		return toClassName(this.struct);
	},

	toSelector: function() {
		return toSelector(this.struct);
	},

	query: function(scope) {
		return (scope || document).querySelectorAll(this.toSelector());
	}
}
