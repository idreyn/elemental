# What's wrong with this picture? 

HTML5 is an umbrella term for three things:
*  HTML, for semantics
*  CSS, for styling
*  Javascript, for interaction

These three components work together nicely, especially when your content is relatively simple. But sometimes you need to create more complex components in HTML5, requiring you to write the semantics, styling, and interaction for a single item in three different files. In a typical workflow this means putting a piece of 'sample' HTML somewhere in the DOM, writing and applying a CSS rule to match it, and then creating a globally-scoped 'constructor' function like this:
	
	function makeSelectBox(items) {
		var el = $($('#proto .select-box').html());
		items.forEach(function(item) {
			var itemEl = $("<div class='select-box-option'></div>");
			$(itemEl).html(item).click(function() {
				doSelectItem(item);
			});
			$(el).find('.select-box-options').append(itemEl);
		});
		$(el).hover(function() {
			...
		}).click(function() {
			...
		});
		function doSelectItem() {
			...
		}
		return el;
	}

Elemental offers a better alternative to this mess by letting you write HTML, CSS, and JS together in a way that makes sense. Consider this partial Elemental definition for a simple select box:
	
	def better-select(options,width='250px',type='div') {
	
		html {
			<$type>
				<span class='label'></span>
				<div class='arrow'>...</div>
				<div class='options'></div>
			</$type>
		}
		
		css {
			width: $width;	
		}
		
		constructor {
			console.log('I am '+this.width+' wide!');
		}
		
		on click(e) {
			console.log('I have been clicked!');
		}
		
	}
	
Nice, isn't it? With Elemental you can clearly define what a `.better-select` is supposed to be &mdash; what its HTML looks like, how it is styled, and how it behaves. So in a sense, Elemental is a tiny domain-specific language (DSL) for writing components in HTML.

# The Format

Elemental definitions go inside a `.elm` file, which consists of one or more `def` statements that look like this:

	def my-element(value,width='250px') {
		
		html {
			<span width='$width'>$value</span>
		}
		
		...
	
	}
	
This tells us that an element with the class `.my-element` is just a span of some width. If we save it to `my-element.elm`, we can include elemental.js into our document and then write:

	elm.using('my-element.elm',function() {
		// We're ready!
		// Note that you can actually pass as many .elm files as you want into using,
		// as long as the last argument is a callback to be executed when they are
		// all finished loading.
		
		var el = elm.create('my-element','Hello world!','300px');
	});
	
And just like that, `el` is now `<span width='300px'>Hello World!</span>`. Notice how `$width` and `$value` were replaced with the arguments passed into `create`! This is exciting. No more of this:
	
		var el = $("<div class='item-row' style='width:" + width + "px'>" + value + "</div>");
		
But that's not all Elemental can do. Here's the lowdown on all the different blocks that can be added to a definition:

*  __html:__ Every Elemental definition needs an HTML block. When `elm.create` is called, this is the HTML that is used to create the element before any work can be done on it. This needs to be the first block in the definition, too. Identifiers prefixed with a dollar sign ($likeThisOne) will be replaced with the parameters passed into the constructor.

*  __css:__ You can put an entire CSS rule in this block and it will be applied to your definition. Dollar-signed identifiers work here too.

* __hover:__ Just a CSS block that is only applied on hover.

* __focus:__ Just a CSS block that is only applied when the element has focus.

* __constructor:__ This one's a biggie. Constructor contains Javascript that is executed as soon as the object is created. You can't use $variables here...instead, the arguments you passed into the constructor have become properties of the object! Here, as in all JS blocks, `this` refers to the object being defined and `$this` is a cached reference to its jQuery wrapper.

* __on event(e):__ The `on` block binds the JS it contains to an event, say, `click` or `keydown`. The parentheses can contain parameters to be used inside the block, but are completely optional.

* __method doSomething([params]):__ A `method` block is just a function bound to the object being defined. You can call it later.

* __my item([params]):__ The `my` keyword lets you nest Elemental definitions. When Elemental sees a `my` block, it creates another definition that is localized in scope. It will be applied to any matching elements in the `html` block, but you can create another one using `this.create(type,params...)` in a JS block. Nested JS blocks can use `$parent` and `$root` to navigate the structure of the definition.

* __find selector:__ Lets you apply a CSS rule to an arbitrary selector. Note that this happens only once, when the object is created.



		
		