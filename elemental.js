var elm;

(function () {

    $.holdReady(true);

    var StringUtil = {};
    var ParseUtil = {};

    StringUtil.stringsAreEqual = function (s1, s2, caseSensitive) {
        if (caseSensitive) {
            return (s1 == s2);
        } else {
            return (s1.toUpperCase() == s2.toUpperCase());
        }
    }

    StringUtil.trim = function (input) {
        return StringUtil.ltrim(StringUtil.rtrim(input));
    };


    StringUtil.ltrim = function (input) {
        var size = input.length;
        for (var i = 0; i < size; i++) {
            if (input.charCodeAt(i) > 32) {
                return input.substring(i);
            }
        }
        return "";
    }

    StringUtil.rtrim = function (input) {
        if (!input) return '';
        var size = input.length;
        for (var i = size; i > 0; i--) {
            if (input.charCodeAt(i - 1) > 32) {
                return input.substring(0, i);
            }
        }

        return "";
    }

    StringUtil.beginsWith = function (input, prefix) {
        return (prefix == input.substring(0, prefix.length));
    }

    StringUtil.endsWith = function (input, suffix) {
        return (suffix == input.substring(input.length - suffix.length));
    }

    StringUtil.remove = function (input, remove) {
        return StringUtil.replace(input, remove, "");
    }

    StringUtil.replace = function (input, replace, replaceWith) {
        return input.split(replace).join(replaceWith);
    }

    StringUtil.stringHasValue = function (s) {
        //todo: this needs a unit test
        return (s != null && s.length > 0);
    }

    StringUtil.trimslashes = function (raw) {
        var str = new String(raw)
        var myPattern = new RegExp("\\'", 'g')
        str = str.replace(myPattern, "'")
        myPattern = /\\\\/g;
        str = str.replace(myPattern, "\\")
        return str;
    }

    ParseUtil.split = function (src, c) {
        var r = []
        var t = ParseUtil.findEach(src, c)
        var index = 0
        for (var i = 0; i < t.length; i++) {
            if (ParseUtil.isClear(src, t[i])) {
                r.push(src.slice(index, t[i]))
                index = t[i] + 1
            }
        }
        r.push(src.slice(index));
        r = [r[0]].concat(r.slice(1).map(function (i) {
            return i.slice(c.length - 1)
        }));
        return r
    }


    ParseUtil.isClear = function (src, ind) {
        var paren = 0
        var quote = ""
        var cbracket = 0
        var sbracket = 0
        var bar = false
        var t = src.charAt(ind)
        for (var i = 0; i < ind + 1; i++) {
            var c = src.charAt(i)
            if ((c == "'" || c == '"') && src.charAt(i - 1) != "\\") {
                if (quote == "") {
                    quote = c
                } else if (quote == c) {
                    quote = ""
                }
            }
            if (quote != "") continue
            if (c == "{") cbracket++
            if (c == "}") cbracket = Math.max(cbracket - 1, 0)
            if (c == "[") sbracket++
            if (c == "]") sbracket--
            if (c == "(") paren++
            if (c == ")") paren--
            if (c == "|") bar = !bar;
        }
        if (t == "(") {
            return cbracket == 0 && sbracket == 0 && paren == 1 && quote == ""

        }
        if (t == "[") {
            return cbracket == 0 && sbracket == 1 && paren == 0 && quote == ""

        }
        if (t == "{") {
            return cbracket == 1 && sbracket == 0 && paren == 0 && quote == ""
        }
        return cbracket == 0 && sbracket == 0 && paren == 0 && quote == "" && !bar;
    }

    ParseUtil.nextIndexOf = function (a, src) {
        if (!(a instanceof Array)) {
            a = [a];
        };
        for (var j = 0; j < a.length; j++) {
            var test = a[j]
            var arr = ParseUtil.findEach(src, test)
            for (var k = 0; k < arr.length; k++) {
                var i = arr[k]
                if (ParseUtil.isClear(src, i)) {
                    return i
                }
            }
        }
        return -1
    }

    ParseUtil.findEachClear = function (src, search) {
        var res = ParseUtil.findEach(src, search);
        return res.filter(function (n) {
            return ParseUtil.isClear(src, n);
        });
    };

    ParseUtil.findEach = function (src, search) {
        var arr = [];
        if (typeof search == "string") search = [search];
        search.forEach(function (s) {
            var index = -1
            var substring = src
            var i
            do {
                i = substring.indexOf(s)
                if (i == -1) break
                index += i + 1;
                arr.push(index)
                substring = substring.slice(i + 1)
            } while (i != -1);
        });

        arr = arr.sort(function (a, b) {
            return a - b;
        });
        return arr;
    }


    ParseUtil.completeStatement = function (src) {
        var paren = 0
        var quote = ""
        var cbracket = 0
        var sbracket = 0
        var bar = false
        var trySub = false
        var sub = false
        var subIndex = 0
        var substring
        var j = 0

        for (var i = 0; i < src.length; i++) {
            var c = src.charAt(i)
            if ((c == "'" || c == '"') && src.charAt(i - 1) != "\\") {
                if (quote == "") {
                    quote = c
                } else if (quote == c) {
                    quote = ""
                }
            }
            if (quote != "") continue
            if (c == "(") paren++
            if (c == ")") paren--
            if (c == "{") cbracket++
            if (c == "}") cbracket--
            if (c == "[") sbracket++
            if (c == "]") sbracket--
            if (c == "|") bar = !bar

        }
        return quote == "" && paren == 0 && cbracket == 0 && sbracket == 0 && bar
    }

    ParseUtil.replace = function (src, from, to) {
        return ParseUtil.split(src, from).join(to)
    }

    ParseUtil.handleEscapeChars = function (s) {
        return s.replace(/\\n/g, "\n").replace(/\\t/g, "\t")
    }

    function javascript_syntactic_sugar(res) {
        // A little bit of syntactic sugar: @my-element becomes my('my-element')
        res = res.replace(/@[A-Za-z][A-Za-z0-9_\-]*/g, function(s) {
            return "my('" + s.slice(1) + "')"
        });
        // ...and $my-element becomes $my('my-element') except in a few cases
         res = res.replace(/\$[A-Za-z][A-Za-z0-9_\-]*/g, function(s) {
            if(['parent','this','root','my'].indexOf(s.slice(1)) == -1) {
                return "$my('" + s.slice(1) + "')"
            } else {
                return s;
            }
        });
        // And use # as a 'fat arrow' to bind methods to their owners
        // this.#myMethod -> $.proxy(this.myMethod,this)
        res = res.replace(/this.#([A-Za-z][A-Za-z0-9_\-]*)/g, function(s) {
            return '$.proxy(' + s.split('#').join('') + ',this)';
        });
        // [[Typename param1,param2...]] becomes elm.create('TypeName',param1,param2...)
        res = res.replace(/\[\[([A-Za-z][A-Za-z0-9_\-]*):([A-Za-z][A-Za-z0-9_\-]*)\s*(.*)\]\]/,"elm.create('$2',$3).named('$1')");
        res = res.replace(/\[\[([A-Za-z][A-Za-z0-9_\-]*)\s*(.*)\]\]/,"elm.create('$1',$2)");
        return res;
    }

    function add_elemental_methods(self,frame) {
        frame = frame || {};
        self.$ = $(self);
        // Add getStyle, setStyle, applyStyle function
        self.getStyle = function(name,prop) {
            var style = self.__styles__[name];
            if(!prop) return style;
            if(!style) return;
            style.forEach(function(s) {
                if(s.prop == prop) {
                    return s.value;
                }
            });
        };
        self.setStyle = function(name,prop,val) {
            var style = self.__styles__[name];
            style.forEach(function(s) {
                if(s.prop == prop) {
                    s.value = val;
                }
            });
        };
        self.applyStyle = function(name) {
            var style = (typeof name == 'string') ? self.__styles__[name] : name;
            if(!style) return;
            style.forEach(function (p) {
                var val = p.value;
                for (var prop in frame) {
                    val = val.split('$' + prop).join(frame[prop]);
                }
                $(self).css(p.prop, val);
            });
        };
        self.my = function(type) {
            return $(self).find('.' + type).get(0);
        };
        self.$my = function(type) {
            return $(self).find('.' + type);
        };
        self.named = function(name) {
            $(self).addClass(name);
            return self;
        }
        self.parent = function(name) {
            if(name) {
                return $(self).parents('.' + name).get(0);
            } else {
                return $(self).parent().get(0);
            }
        }
    }

    elm = {
        _argarr: function (a) {
            var n = [],
                i;
            for (i = 0; i < a.length; i++) {
                n.push(a[i]);
            }
            return n;
        },
        _definitions: {},
        def: function (n) {
            return elm._definitions[n];
        },
        create: function () {
            var args = elm._argarr(arguments),
                type = args[0],
                rest = args.slice(1);
            if (elm.def(type)) {
                return elm.def(type).call(null, rest, null);
            } else {
                throw new Error("[Elemental] Can't find type " + type + ".");
            }
        },
        elmify: function(el) {
            for(var def in elm._definitions) {
                $(el).find('.' + def).toArray().map(function(child) {
                    if(!$(child).hasClass('elm-init')) {
                        console.log('go',$(child).attr('class'));
                        elm.apply(child,def);
                    }
                });
                if($(el).hasClass(def) && !$(el).hasClass('elm-init')) elm.apply(el,def);
            }
        },
        apply: function () {
            var args = elm._argarr(arguments),
                el = args[0],
                type = args[1],
                rest = args.slice(2);
            if (elm.def(type)) {
                return elm.def(type).call(null, rest, el);
            } else {
                throw new Error("[Elemental] Can't find type " + type + ".");
            }
        },
        extend: function(el,type,frame) {
            return elm.def(type).call(null,frame || [],el,false);
        },
        using: function () {
            var files = elm._argarr(arguments),
                cb;
            if (files[files.length - 1] instanceof Function) {
                cb = files.pop();
            }
            if(files.length == 0) cb();
            var i = 0;
            files.forEach(function (file) {
                $.get(file, {}, function (data) {
                    elm.parse(data,file);
                    i++;
                    if (i == files.length) {
                        if (cb) cb.call();
                    }
                });
            });
        },
        parse: function(file,filename,lineOffset,depthOffset,add) {

            if(add !== false) add = true;

            var str = {};

            str.trim = function (input) {
                return str.ltrim(str.rtrim(input));
            };


            str.ltrim = function (input) {
                var size = input.length;
                for (var i = 0; i < size; i++) {
                    if (input.charCodeAt(i) > 32) {
                        return input.substring(i);
                    }
                }
                return "";
            }

            str.rtrim = function (input) {
                if (!input) return '';
                var size = input.length;
                for (var i = size; i > 0; i--) {
                    if (input.charCodeAt(i - 1) > 32) {
                        return input.substring(0, i);
                    }
                }
                return "";
            }

            str.split = function(src,by,keepDelimiter) {
                var res = [],
                    delim = '',
                    build = '',
                    next = '',
                    chars = src.split('');
                if(typeof by == 'string') by = [by];
                while(next = chars.shift()) {
                    if(by.indexOf(next) != -1) {
                        // next is a delimeter
                        res.push(
                            (keepDelimiter? delim : '') + build
                        );
                        build = '';
                        delim = next;
                    } else {
                        build += next;
                    }
                }
                res.push(
                    (keepDelimiter? delim : '') + build
                );
                return res;
            }

            str.nonEmpty = function(s) {
                return s && s.length > 0;
            }

            lineOffset |= 0;
            depthOffset |= 0;
            var lines = file.split('\n'),
                definitions = [],
                currentDefinition,
                currentBlockBody,
                currentBlock,
                collect = [],
                depth = 0,
                line,
                lineNumber = 0;
                expectable = {
                    'DEFINITION': 'def',
                    'BLOCK': ['html','contents','css','method','on','extends','find','my','style','hover','focus','constructor','properties'],
                    'CONTENTS': ''
                };

            function getDepth(line) {
                var i = 0;
                while(line.charAt(i) == '\t') {
                    i++;
                }
                return i + depthOffset;
            }

            function keyword_category(kw) {
                for(var k in expectable) {
                    if(expectable[k].indexOf(kw) != -1) {
                        return k;
                    }
                }
                return 'NOT_A_KEYWORD';
            }

            function keyword_to_block_type(kw) {
                var map = {
                    'extends': 'extensor',
                    'html': 'html',
                    'contents': 'contents',
                    'css': 'css',
                    'style': 'style',
                    'hover': 'hover',
                    'focus': 'focus',
                    'method': 'method',
                    'on': 'event',
                    'constructor': 'constructor',
                    'find': 'subselector',
                    'my': 'subdef',
                    'properties': 'properties'
                };
                return map[kw];
            }

            function expect_empty(str) {
                return !str || str.length == 0;
            }

            function error(description) {
                throw '[' + filename + ', line ' + (lineNumber + lineOffset) + '] ' + description;
            }

            function warn(description) {
                console.warn('[' + filename + ', line ' + (lineNumber + lineOffset) + '] ' + description);   
            }

            function warn_about_braces() {
               // warn('Braces are deprecated in favor of whitespace demarcation');
            }

            function error_unexpected_block_argument(str,kw) {
                error(str + ' is invalid after ' + kw);
            }

            function error_expected_block_argument(kw) {
                error(kw + ' should be followed by an argument');
            }

            function strip_depth(arr) {
                return arr.map(function(str) {
                    return str.slice(1);
                });
            }

            function add_block(currentBlockBody) {
                currentBlockBody.definition = currentDefinition;
                parse_body(currentBlockBody,currentBlock,collect);
                currentDefinition.body.push(currentBlockBody);
            }

            function add_definition(currentDefinition) {
                definitions.push(currentDefinition);
            }

            function parse_definition_signature(def,signature) {
                if (signature.charAt(signature.length - 1) == '{') {
                    warn('Braces are deprecated in favor of whitespace demarcation');
                    signature = signature.slice(0,-1);
                }
                var reg = /^([A-Za-z0-9_\-]*)(\([A-Za-z0-9_=\"\'\.\,\s]*\))?$/;
                var res = signature.match(reg);
                if(!res || !res[1]) {
                    error('"' + signature + '" is not a valid definition signature');
                } else {
                    def.name = res[1];
                    if(res[2]) {
                        def.parameters = res[2].slice(1,res[2].length - 1).split(',').map(function(k) {
                            var s = k.split('=').map(StringUtil.trim);
                            if(s.length > 1) {
                                var val = s[1];
                                if(val.charAt(0) == '"' || val.charAt(0) == "'") {
                                    val = val.slice(1,-1);
                                }
                                return {
                                    name: s[0],
                                    value: val
                                };
                            } else {
                                return {
                                    name: k,
                                    value: null
                                };
                            }
                        })
                    } else {
                        def.parameters = [];
                    }
                }
            }

            function parse_block_signature(def,kw,signature) {
                def.type = keyword_to_block_type(kw);
                switch(kw) {
                    case 'method':
                        var reg = /^([A-Za-z0-9_]*)(\([A-Za-z0-9_,]*\))?$/;
                        var res = signature.match(reg);
                        if(!res || !res[1]) {
                            error('"' + signature + '" is not a valid method signature');
                        } else {
                            def.name = res[1];
                            if(res[2]) {
                                def.parameters = res[2].slice(1,res[2].length - 1).split(',')
                            } else {
                                def.parameters = [];
                            }
                        }
                        break;
                    case 'on':
                        var reg = /^([A-Za-z0-9_\-\s]*)(\([A-Za-z0-9_,]*\))?$/;
                        var res = signature.match(reg);
                        if(!res || !res[1]) {
                            error('"' + signature + '" is not a valid event handler signature');
                        } else {
                            def.event = res[1];
                            if(res[2]) {
                                def.parameters = res[2].slice(1,res[2].length - 1).split(',')
                            } else {
                                def.parameters = [];
                            }
                        }
                        break;
                    case 'my':
                        def.name = signature;
                        break;
                    case 'find':
                        def.cssSelector = signature;
                        break;
                    case 'style':
                        def.name = signature;
                }
            }

            function parse_body(def,kw,body) {
                var res;
                if(kw != 'my' && kw != 'find') {
                    body = body.map(str.trim);
                }
                switch(kw) {
                    case 'properties':
                    case 'css':
                    case 'hover':
                    case 'focus':
                    case 'style':
                        // Style
                        res = body.map(function(line) {
                            var r = line.split(':'),
                                prop = str.trim(r[0]),
                                value = str.trim(r[1]);
                            if (value.charAt(value.length - 1) == ';' || value.charAt(value.length - 1) == ',') {
                                value = value.slice(0, -1);
                            }
                            return {
                                prop: prop,
                                value: value
                            };
                        });
                        def.properties = res;
                        break;
                    case 'method':
                    case 'constructor':
                    case 'on':
                         // Javascript
                        res = body.join('\n');
                        res = javascript_syntactic_sugar(res);
                        break;
                    case 'contents':
                    case 'html':
                        // HTML
                        res = body.join('\n');
                        def.html = str.trim(res);
                        break;
                    case 'extends':
                        // List of superclasses
                        res = body.filter(str.nonEmpty);
                        def.supers = res;
                        break;
                    case 'find':
                        var newBody = 'def ' + def.name + '\n';
                        newBody +=  strip_depth(body,1).join('\n');
                        res = elm.parse(newBody,filename,lineNumber,0,false);
                        res = res[0];
                        res = res.body;
                    case 'my':
                        // Subdefinition (recursive)
                        var newBody = 'def ' + def.name + '\n';
                        newBody +=  strip_depth(body,1).join('\n');
                        res = elm.parse(newBody,filename,lineNumber,0,false);
                        res = res[0];
                        def.name = res.name;
                        def.parameters = res.parameters;
                        res = res.body;
                }
                def.body = res;
            }
            try {
                while(lines.length > 0) {
                    line = lines.shift();
                    lineNumber++;
                    var depth = getDepth(line);
                    var split = line.split(' ').map(str.trim);
                    var first = split[0]
                    var rest = split[1];
                    if(first.length == 0) {
                        // Line is whitespace
                        continue;
                    }
                    if(first.slice(0,2) == '//') {
                        continue;
                    }
                    if(depth < 2 && first == '}') {
                        warn_about_braces();
                        continue;
                    }
                    if(depth == 0) {
                        expect = 'DEFINITION';
                    }
                    if(depth == 1) {
                        expect = 'BLOCK';
                    }
                    if(depth > 1) {
                        expect = 'CONTENTS';
                        if(!currentBlock) {
                            error('Saw ' + first + ' where a BLOCK was expected');
                        }
                    }
                    if(expect != 'CONTENTS' && expectable[expect].indexOf(first) == -1) {
                        error('Expected a ' + expect + ' but got ' + first + ' which is a ' + keyword_category(first) + ' instead');
                    }
                    // Okay, now we can assume that we got a valid keyword for this depth
                    if(depth == 0) {
                        // Clean up from the last definition
                        if(currentBlock) {
                            add_block(currentBlockBody);
                        }
                        if(currentDefinition) {
                            add_definition(currentDefinition);
                        }
                        currentBlockBody = null;
                        currentBlock = null;
                        currentDefinition = {
                            body: []
                        };
                        if (rest.charAt(rest.length - 1) == '{') {
                            warn_about_braces();
                            rest = rest.slice(0,-1);
                        }
                        parse_definition_signature(currentDefinition,rest);
                    }
                    if(depth == 1) {
                        if(currentBlock) {
                            add_block(currentBlockBody);
                        }
                        collect = [];
                        currentBlock = first;
                        currentBlockBody = {
                            body: ''
                        }
                        if (rest.charAt(rest.length - 1) == '{') {
                            warn_about_braces();
                            rest = rest.slice(0,-1);
                        }
                        switch(first) {
                            case 'html':
                            case 'contents':
                            case 'properties':
                            case 'css':
                            case 'hover':
                            case 'focus':
                            case 'constructor':
                            case 'extends':
                                expect_empty(rest) || error_unexpected_block_argument(rest,first);
                                break;
                            default:
                                !expect_empty(rest) || error_expected_block_argument(first);
                        }
                        parse_block_signature(currentBlockBody,first,rest);
                    }
                    if(depth > 1) {
                        collect.push(line);
                    }
                }
            } catch(e) {
                error(e);
            }

            if(currentBlockBody) add_block(currentBlockBody);
            if(currentDefinition) add_definition(currentDefinition);

            if(add) {
                definitions.map(function(def) {
                    elm._definitions[def.name] = elm.createConstructor(def);
                        $('.' + def.name).each(function () {
                            elm.apply(this, def.name);
                    });
                });
            }

            return definitions;
        },       
        createConstructor: function (definition, root) {
            if (root === undefined) root = true;
            return function (args, self, fireReady) {
                var frame = {},
                i;
                if (fireReady === undefined) fireReady = true;
                if(args instanceof Array) {
                    for (i = 0; i < definition.parameters.length; i++) {
                        if (args[i] !== undefined) {
                            frame[definition.parameters[i].name] = args[i];
                        } else {
                            if(!self || self[definition.parameters[i].name] === undefined) {
                                frame[definition.parameters[i].name] = definition.parameters[i].value;
                            }
                        }
                    }
                } else {
                    frame = args || {};
                }
                if(self) self.__elemental = true;
                definition.body.forEach(function (selector) {
                    //try {
                        self = elm.applyBlockTo(self, selector, frame, null, root);
                    //} catch(e) {
                   //   throw new Error('To create an element with elm.create(), its definition must begin with an html block.');
                  //  }
                });
                self.____construct = function() {
                    self.____constructors = self.____constructors || [];
                    self.____constructors.reverse().forEach(function(constructor) {
                        if(!constructor.called) constructor.call(self);
                        constructor.called = true;
                    });
                 }
                add_elemental_methods(self,frame);
                self.____construct();
                $(self).find('*').each(function() {
                    if(this.____construct) {
                        this.____construct();
                    }
                })
                $(self).addClass(definition.name);
                if(fireReady) $(self).trigger('ready');
                self.$ = $(self);
                return self;
            };
        },
        applyBlockTo: function (__el__, __selector__, __frame__, parent, root) {
            // All of these underscores are to avoid namespace pollution...
            // These local variables will be closed under eval(), so we need
            // to make them as hard to access as possible.
            var self = __el__;
            if (root === true) root = __el__;
            switch (__selector__.type) {
                case 'html':
                    var markup = __selector__.html;
                    for (var prop in __frame__) {
                        markup = markup.split('$' + prop).join(__frame__[prop]);
                    }
                    if (!__el__) {
                        __el__ = $(markup).get(0);
                    }
                    __el__.__elemental = true;
                    for (var prop in __frame__) {
                        __el__[prop] = __frame__[prop];
                    }
                    // Find [[]]
                    var nl = __el__.childNodes;
                    var arr = [];
                    for(var i = nl.length; i--; arr.unshift(nl[i]));
                    arr.forEach(function(node) {
                        var text = node.nodeValue;
                        if(!text) return;
                        var elementsToAdd = [];
                        text.split('\n').forEach(function(line) {
                            var m = line.match(/\[\[([A-Za-z][A-Za-z0-9_\-:]*)\s*(.*)\]\]/);
                            if(m) {
                                var args = eval('(function() { return [' + m[2] + ']; }).call(__el__);');
                                var name;
                                var type = m[1];
                                var split = type.split(':');
                                if(split.length > 1) {
                                    name = split[0];
                                    type = split[1];
                                }
                                args.unshift(type);
                                var el = elm.create.apply(null,args);
                                if(name) $(el).addClass(name);
                                elementsToAdd.push(el);
                            } else {
                                elementsToAdd.push(line);
                            }
                        });
                        elementsToAdd.forEach(function(el) {
                            $(node).before(el);
                        });
                        $(node).remove();
                    });
                    // Attach some functions
                    __el__.__definitions = {};
                    __el__.create = function () {
                        var args = elm._argarr(arguments),
                            type = args[0],
                            rest = args.slice(1);
                        if (__el__.__definitions[type]) {
                            return __el__.__definitions[type].call(null, rest, null);
                        } else {
                            if (elm.def(type)) {
                                return elm._definitions[type].call(null, rest, null);
                            }
                        }
                    }
                    break;
                case 'contents':
                    var markup = __selector__.html;
                    for (var prop in __frame__) {
                        markup = markup.split('$' + prop).join(__frame__[prop]);
                    }
                    $(__el__).append(markup);
                    // Find [[]]
                    var nl = __el__.childNodes;
                    var arr = [];
                    for(var i = nl.length; i--; arr.unshift(nl[i]));
                    arr.forEach(function(node) {
                        var text = node.nodeValue;
                        if(!text) return;
                        var elementsToAdd = [];
                        text.split('\n').forEach(function(line) {
                            var m = line.match(/\[\[([A-Za-z][A-Za-z0-9_\-:]*)\s*(.*)\]\]/);
                            if(m) {
                                var args = eval('(function() { return [' + m[2] + ']; }).call(__el__);');
                                var name;
                                var type = m[1];
                                var split = type.split(':');
                                if(split.length > 1) {
                                    name = split[0];
                                    type = split[1];
                                }
                                args.unshift(type);
                                var el = elm.create.apply(null,args);
                                if(name) $(el).addClass(name);
                                elementsToAdd.push(el);
                            } else {
                                elementsToAdd.push(line);
                            }
                        });
                        elementsToAdd.forEach(function(el) {
                            $(node).before(el);
                        });
                        $(node).remove();
                    });
                    break;
                case 'extensor':
                    __selector__.supers.forEach(function (s) {
                        __el__ = elm.extend(__el__, s, __frame__);
                    });
                    break;
                case 'css':
                    __selector__.properties.forEach(function (p) {
                        var val = p.value;
                        for (var prop in __frame__) {
                            val = val.split('$' + prop).join(__frame__[prop]);
                        }
                        $(__el__).css(p.prop, val);
                    });
                    break;
                case 'style': 
                    if(!__el__.__styles__) __el__.__styles__ = {};
                    __el__.__styles__[__selector__.name] = __selector__.properties.map(function(p) {
                        // We're mapping to create a new list of CSS properties for each element, instead of modifying the definition
                        return {
                            prop: p.prop,
                            value: p.value
                        };
                    });
                    break;
                case 'hover':
                    var changes = __selector__.properties.map(function (p) {
                        var val = p.value;
                        for (var prop in __frame__) {
                            val = val.split('$' + prop).join(__frame__[prop]);
                        }
                        return {
                            prop: p.prop,
                            value: val
                        }
                    });
                    var prev = [];
                    $(__el__).hover(function () {
                        changes.forEach(function (change) {
                            var res = {
                                prop: change.prop,
                                value: $(__el__).css(change.prop)
                            };
                            // Firefox fix
                            if (!StringUtil.stringHasValue(res.value)) {
                                res.value = $(__el__).css(
                                change.prop.split('-').reduce(function (a, b) {
                                    return a + b.charAt(0).toUpperCase + b.slice(1);
                                }));
                            }
                            prev.push(res);
                            $(__el__).css(change.prop, change.value);
                        });
                    }, function () {
                        prev.forEach(function (pr) {
                            $(__el__).css(pr.prop, pr.value);
                        });
                        prev = [];
                    });
                    break;
                case 'focus':
                    var changes = __selector__.properties.map(function (p) {
                        var val = p.value;
                        for (var prop in __frame__) {
                            val = val.split('$' + prop).join(__frame__[prop]);
                        }
                        return {
                            prop: p.prop,
                            value: val
                        }
                    });
                    var prev = [];
                    $(__el__).focus(function () {
                        changes.forEach(function (change) {
                            var res = {
                                prop: change.prop,
                                value: $(__el__).css(change.prop)
                            };
                            // Firefox fix
                            if (!StringUtil.stringHasValue(res.value)) {
                                res.value = $(__el__).css(
                                change.prop.split('-').reduce(function (a, b) {
                                    return a + b.charAt(0).toUpperCase + b.slice(1);
                                }));
                            }
                            prev.push(res);
                            $(__el__).css(change.prop, change.value);
                        });
                    }).blur(function () {
                        prev.forEach(function (pr) {
                            $(__el__).css(pr.prop, pr.value);
                        });
                        prev = [];
                    });
                case 'event':
                    var $this = $self = $(__el__);
                    var $parent = $(parent);
                    var $root = $(root);
                    $(__el__).bind(__selector__.event, function () {
                        var __args__ = elm._argarr(arguments);
                        var ____func = 'var __func__ = function(' + __selector__.parameters.join(',') + ') { ';
                        ____func += 'try {';
                        ____func += __selector__.body;
                        ____func += '} catch(e) {';
                        ____func += 'throw "Elemental.' + __selector__.definition.name + '#on:' + __selector__.event + ' <- " + e.valueOf();'; 
                        ____func += '}';
                        ____func += '}';
                        eval(____func);
                        __func__.apply(__el__, __args__);
                    });
                    break;
                case 'constructor':
                    var $this = $self = $(__el__);
                    var $parent = $(parent);
                    var $root = $(root);
                    var ____func = 'var __constructor__ = function() { ';
                    ____func += 'try {';
                    ____func += (__selector__.body && __selector__.body.length > 0) ? __selector__.body : '';
                    ____func += '} catch(e) {';
                    ____func += 'throw "Elemental.' + __selector__.definition.name + '#(constructor) <- " + e.valueOf();'; 
                    ____func += '}';
                    ____func += '}';
                    try {
                        eval(____func);
                        if(!__el__.____constructors) __el__.____constructors = [];
                        __el__.____constructors.push(__constructor__);
                    } catch (e) {}
                    break;
                case 'method':
                    var $this = $self = $(__el__);
                    var $parent = $(parent);
                    var $root = $(root);
                    var ____func = 'var __method__ = function(' + __selector__.parameters.join(',') + ') {';
                    ____func += 'try {';
                    ____func += __selector__.body;
                    ____func += '} catch(e) {';
                    ____func += 'throw "Elemental.' + __selector__.definition.name + '#' + __selector__.name + '<- " + e.valueOf();'; 
                    ____func += '}';
                    ____func += '}';
                    eval(____func);
                    __el__[__selector__.name] = __method__;
                    break;
                case 'subselector':
                    $(__el__).find(__selector__.cssSelector).each(function (i, e) {
                        __selector__.body.forEach(function (block) {
                            elm.applyBlockTo(e, block, __frame__, __el__, root);
                        });
                        e.$ = $(e);
                        add_elemental_methods(e);
                        e.____construct = function() {
                            e.____constructors = e.____constructors || [];
                            e.____constructors.reverse().forEach(function(constructor) {
                                if(!constructor.called) constructor.call(e);
                                constructor.called = true;
                            });
                         }
                         e.____construct();
                    });
                    break;
                case 'subdef':
                    if(!__el__.__definitions) __el__.__definitions = {};
                    var constructMe = __el__.__definitions[__selector__.name] = elm.createConstructor(__selector__, root);
                    $(__el__).find('.' + __selector__.name).each(function (i, e) {
                        __selector__.body.forEach(function (block) {
                            elm.applyBlockTo(e, block, __frame__, __el__, root);
                        });
                        e.$ = $(e);
                        add_elemental_methods(e);
                        e.____construct = function() {
                            e.____constructors = e.____constructors || [];
                            e.____constructors.reverse().forEach(function(constructor) {
                                if(!constructor.called) constructor.call(e);
                                constructor.called = true;
                            });
                         }
                         e.____construct();
                    });
                    break;
                case 'properties':
                    if(__el__) {
                        __selector__.properties.forEach(function (p) {
                            var val = p.value;
                            var fn = '(function() { return ' + val + '; }).call(__el__)';
                            __el__[p.prop] = eval(fn);
                        });
                    } else {
                        __selector__.properties.forEach(function(p) {
                            var val = eval(p.value);
                            __frame__[p.prop] = val;
                        });
                    }
                    break;
                default:
                    throw "[Elemental] I don't know what to do with a " + __selector__.type + " block!";
            };
            return __el__;
        },
        log: function() {
            var args = elm._argarr(arguments);
            if(elm.verbose) console.log.apply(console,arguments);
        }
    };

    var seeIfLoaded = function () {
        if ($('head').length > 0) {
            elm.using.apply(null, $('script').toArray().map(function (i) {
                if ($(i).attr('type').indexOf('elemental') != -1) {
                    return $(i).attr('src') || elm.parse($(i).html());
                } else {
                    return false;
                }
            }).filter(function (i) {
                return i;
            }).concat(function (d) {
                $.holdReady(false);
            }));
        } else {
            setTimeout(seeIfLoaded, 10);
        }
    }
    seeIfLoaded();

}).call();