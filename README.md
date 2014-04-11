![elemental](http://i.eho.st/ppbljd2x.png "Elemental")

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
		
		method doSelectItem {
			// Blah blah blah...
		}
		
	}
	
Nice, isn't it? With Elemental you can clearly define what a `.better-select` is supposed to be &mdash; what its HTML looks like, how it is styled, and how it behaves. So in a sense, Elemental is a tiny domain-specific language (DSL) for writing components in HTML.

## The Format

Elemental definitions go inside a `.elm` file, which consists of one or more `def` statements that look like this:

	def my-element(value,width='250px') {
		
		html {
			<span width='$width'>$value</span>
		}
		
		...
	
	}
	
This tells us that an element with the class `.my-element` is just a span of some width. If we save it to `my-element.elm`, we can include Elemental.js into our document and then write:

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

*  __html:__ Every Elemental definition needs an HTML block. When `elm.create` is called, this is the HTML that is used to create the element before any work can be done on it. This needs to be the first block in the definition, too. Identifiers prefixed with a dollar sign ($likeThisOne) will be replaced with the parameters passed into the constructor. Only one `html` block will be executed for every definition.

* __content:__ Lets you specify the inner HTML of the element. This is useful when you want to extend another definition and alter its inner HTML while leaving the outer structure intact.

*  __css:__ You can put an entire CSS rule in this block and it will be applied to your definition. Dollar-signed identifiers work here too.

* __hover:__ Just a CSS block that is only applied on hover.

* __focus:__ Just a CSS block that is only applied when the element has focus.

* __constructor:__ This one's a biggie. Constructor contains Javascript that is executed as soon as the object is created. You can't use $variables here...instead, the arguments you passed into the constructor have become properties of the object! Here, as in all JS blocks, `this` refers to the object being defined and `$this` is a cached reference to its jQuery wrapper. When you use `extends` blocks, all constructors passed into the definition will be executed in the order they are received. Tread carefully. 

* __on event(e):__ The `on` block binds the JS it contains to an event, say, `click` or `keydown`. The parentheses can contain parameters to be used inside the block, but are completely optional.

* __method doSomething([parameters...]):__ A `method` block is just a function bound to the object being defined. You can call it later.

* __my item([parameters...]):__ The `my` keyword lets you nest Elemental definitions. When Elemental sees a `my` block, it creates another definition that is localized in scope. It will be applied to any matching elements in the `html` block, but you can create another one using `this.create(type,params...)` in a JS block. Nested JS blocks can use `$parent` and `$root` to navigate the structure of the definition.

* __find [selector]:__ Lets you apply a CSS rule to an arbitrary selector. Note that this happens only once, when the object is created.

* __extends:__ You can provide a newline- or comma-delineated list of other Elemental classes for this one to inherit blocks from. You can add several `extends` blocks to a definition, which is handy because placement matters &mdash; Elemental definitions are read from the topmost block to the bottommost, and this block essentially sticks new blocks in the middle. So if you're extending a definition that specifies its own `html` but you want to define different HTML for the new definition, you need to put the `extends` block after the `html` one. In the same vein, `constructor` blocks will be run in the order they are received. Use caution.

* __style__: Lets you define a CSS style to apply to the element. See the section below for more.

* __properties__: A list of newline-delimited key:value pairs to be applied to the object.

## Special variables

Within a Javascript block, you can use number of built-in variables intended to ease the pain of Javascript's "flexible" scoping system.

* __this:__ Using `this` in a method, handler, or constructor will generally refer to the object at hand. But if you start passing references to these functions, the function will be scoped according to normal JS rules and `this` might end up referring to an event handler target, the global scope, or any number of things that aren't the object you're building.
* __$this:__ A cached version of `$(this)`. It is created once during object construction and will always refer to the object at hand even if `this` refers to something else.
* __self:__ Solves the problem of scope introduced by `this`. `self` will ALWAYS refer to the object at hand, even in situations where `this` is something else (e.g. event handlers, setTimeout callbacks). If you don't want to take advantage of flexible scoping, just use `self` instead of `this`.

## Stylin'

Elemental provides `hover` and `focus` blocks to support the matching CSS psuedoclasses, but it's possible to create additional style blocks to be applied to the definition at runtime. This is accomplished by adding a `style` block like so:

	style active {
		// Yuck, don't actually do this
		background: #F00;
		border: 4px solid #0F0;
	}

Anywhere in your Javascript, you can call the object's `setStyle` method:

	this.applyStyle('active');

You can also query and modify these styles live in your javascript with these methods: `getStyle(styleName,cssProp)` and `setStyle(styleName,cssProp,cssValue)`.

## Query eye for the straight guy

Elemental plays nice with jQuery (actually, it's a dependency). In addition to the `$this`, `$parent`, and `$root` objects mentioned above, you can get a reference to any Elemental object's jQuery wrapper by referencing its `$` property like so:
	`$this.myButton.$.on('click',myCallback);`
Elemental objects also have a pair of functions, `$my` and `my`, which serve as convenient shortcuts to the most common jQuery queries. In short, `object.$my(className)` returns all children of `object` with the CSS class `classname`, while plain old `my` returns the first element of that set. As such, Elemental encourages the use of unique class names to identify objects.

## A little bit of syntactic sugar

Actually, using `$my` and `my` are almost invariably a waste of your time because Elemental includes a little syntactic sugar to make these very common queries more palatable. In any Javascript block, you can use `@element-class` and the preprocessor will replace that with `my('element-class')`. `$element-class` also becomes `$my('element-class')`.

One more handy trick: `this.#methodName` becomes `$.proxy(this.methodName,this)`. Very handy for passing event handlers around as the resulting function is bound to `this` in the current scope!

So what I'm saying here is that you may never use `$.find` again to target children. Hallelujah!

## ...And a little bit of syntactic salt

Believe it or not the curly braces you've been seeing are totally optional in Elemental. It's actually parsed by looking at the indentation, Python style, so the indents are not. Sorry about that!

## A comment on comments

Elemental supports C-style single line (`//`) comments anywhere, and HTML (`<!-- -->`) comments in HTML. Block comments (`/* */`) are not supported anywhere for the time being, even in CSS.

## Inline objects using [[braces]]

In a block containing HTML or Javascript, you can use double square brackets to insert an Elemental object like so:

	var login_button = [[Button 'Login',self.doLogin]];
	// Same as elm.create('Button','Login',self.doLogin);
	$this.append(login_button);
	
You could just as easily append this object within the html block of the definition
	
	html {
		[[Button 'Login',self.doLogin]];
	}
	
To apply a CSS class to the button (making it easy to reference with $my), you can use a colon before the definition name like this:

	html {
		[[login-button:Button 'Login',this.doLogin]];
	}
	
This `login-button` can now be referenced in Javascript:

	method doLogin {
		this.$login-button.hide();
		...
	}

## So how do I use it?

Elemental is dependent on jQuery, so you'll need to include that, along with Elemental.js, in the `<head>` of your document. Anywhere before these `<script>` tags, you can add Elemental definitions like this:
	
	<script type='text/elemental' src='my-definitions.elm'></script>
	
When the DOM is parsed, Elemental will scour the document for elements whose class names match the name of an Elemental definition and will apply the definition to those elements. You can also create a new instance of an Elemental class like this:

	var obj = elm.create('ClassName',[arguments...]);
	
The `elm` object has a couple of other noteworthy methods, too:

* __apply(HTMLElement e,String definition,[arguments...]):__ Applies an Elemental definition to an HTML object. 

* __def(String definition):__  Returns the constructor function for an Elemental definition.

* __parse(String toParse):__ Parses an Elemental definition from any string input.

* __using(String file1, String file2, String fileN...,[Function callback])__: Loads all of the specified Elemental files for use and then calls `callback` when they're ready.

* __elmify(HTMLElement e):__ Looks for class names in `e` and its children and applies matching Elemental definitions.

That's just about it! You're ready to incorporate Elemental into your HTML5 workflow.
