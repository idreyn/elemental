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
                throw new Error("Elm: Can't find type " + type + ".");
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
                throw new Error("Elm: Can't find type " + type + ".");
            }
        },
        extend: function(el,type) {
            return elm.def(type).call(null,[],el,false);
        },
        using: function () {
            var files = elm._argarr(arguments),
                cb;
            if (files[files.length - 1] instanceof Function) {
                cb = files.pop();
            }
            var i = 0;
            files.forEach(function (file) {
                $.get(file, {
                    rand: Math.random()
                }, function (data) {
                    elm.parse(data);
                    i++;
                    if (i == files.length) {
                        if (cb) cb.call();
                    }
                });
            });
        },
        parse: function (str) {
            return ParseUtil.split(str, '\n').filter(function (line) {
                return StringUtil.trim(line).length > 0;
            }).map(function (line) {
                var kw = line.slice(0, line.indexOf(' '));
                if (kw == 'def') {
                    // kw should always equal 'def'
                    var def = elm.parseDefinition(line);
                    elm._definitions[def.name] = elm.createConstructor(def);
                    $('.' + def.name).each(function () {
                        elm.apply(this, def.name);
                    });
                }
            });
        },
        parseDefinition: function (str) {
            var ind = -1,
                sig,
                name,
                params = [],
                body;
            // Should start with 'def' so we'll get rid of that right off the bat
            str = StringUtil.trim(str.slice(4));
            // Get the definition signature -- we'll parse that next
            // Also get the body from inside the brackets
            sig = StringUtil.trim(str.slice(0, ParseUtil.nextIndexOf('{', str)));
            body = StringUtil.trim(str.slice(ParseUtil.nextIndexOf('{', str) + 1, str.length - 1));
            // Sig might have parameters
            if (sig.indexOf('(') != -1) {
                name = sig.slice(0, sig.indexOf('('));
                params = ParseUtil.split(
                sig.slice(sig.indexOf('(') + 1, sig.length - 1),
                ',').map(function (param) {
                    var name, value = null;
                    //Check for a default value
                    if (param.indexOf('=') != -1) {
                        name = StringUtil.trim(param.slice(0, param.indexOf('=')));
                        value = StringUtil.trim(param.slice(param.indexOf('=') + 1));
                        if (value.charAt(0) == '"' || value.charAt(0) == "'") {
                            value = value.slice(1, value.length - 1);
                        }
                    } else {
                        name = param;
                    }
                    return {
                        name: name,
                        value: value
                    }
                });
            } else {
                name = sig;
            }
            return {
                name: name,
                parameters: params,
                body: elm.parseSelectors(body)
            }
        },
        parseSelectors: function (body, topLevel) {
            var sels;
            if (topLevel === undefined) topLevel = true;
            return ParseUtil.split(body, '\n').filter(function (selector) {
                return StringUtil.trim(selector).length > 0;
            }).map(function (selector) {
                var sig, body, name, ind;
                selector = StringUtil.trim(selector);
                ind = ParseUtil.nextIndexOf('{', selector);
                sig = StringUtil.trim(selector.slice(0, ind));
                body = StringUtil.trim(selector.slice(ind + 1, StringUtil.trim(selector).length - 1));
                name = sig.split(' ')[0];
                switch (name) {
                    case 'html':
                        return {
                            type: name,
                            html: body
                        }
                    case 'extends':
                        return {
                            type: 'extensor',
                            supers: ParseUtil.split(body, [',', '\n']).map(StringUtil.trim)
                        }
                    case 'hover':
                    case 'focus':
                    case 'css':
                        return {
                            type: name,
                            properties: ParseUtil.split(body, '\n').map(function (prop) {
                                prop = StringUtil.trim(prop);
                                if (prop.charAt(prop.length - 1) == ';') {
                                    prop = prop.slice(0, prop.length - 1);
                                }
                                prop = prop.split(':');
                                return {
                                    prop: StringUtil.trim(prop[0]),
                                    value: StringUtil.trim(prop[1])
                                }
                            })
                        };
                    case 'style':
                        return {
                            type: name,
                            name: StringUtil.trim(sig.split(' ').slice(1).join(' ')),
                            properties: ParseUtil.split(body, '\n').map(function (prop) {
                                prop = StringUtil.trim(prop);
                                if (prop.charAt(prop.length - 1) == ';') {
                                    prop = prop.slice(0, prop.length - 1);
                                }
                                prop = prop.split(':');
                                return {
                                    prop: StringUtil.trim(prop[0]),
                                    value: StringUtil.trim(prop[1])
                                }
                            })
                        };
                    case 'on':
                        var evt = sig.split(' ').filter(function (l) {
                            return l.length;
                        }).slice(1).join(' '),
                            params = [];
                        if (evt.indexOf('(') != -1) {
                            // Handler has parameters
                            params = evt.slice(evt.indexOf('(') + 1, evt.length - 1).split(',').map(StringUtil.trim);
                            evt = evt.slice(0, evt.indexOf('('));
                        }
                        return {
                            type: 'event',
                            event: evt,
                            parameters: params,
                            body: body
                        };
                    case 'method':
                        var name = sig.split(' ').filter(function (l) {
                            return l.length;
                        })[1],
                            params = [];
                        if (name.indexOf('(') != -1) {
                            // Method has parameters
                            params = name.slice(name.indexOf('(') + 1, name.length - 1).split(',').map(StringUtil.trim);
                            name = name.slice(0, name.indexOf('('));
                        }
                        return {
                            type: 'method',
                            name: name,
                            parameters: params,
                            body: body
                        };
                    case 'constructor':
                        return {
                            type: 'constructor',
                            body: body
                        };
                    case 'find':
                        var cssSelector = sig.split(' ').filter(function (l) {
                            return l.length;
                        })[1];
                        return {
                            type: 'subselector',
                            cssSelector: cssSelector,
                            body: elm.parseSelectors(body, false)
                        };
                    case 'my':
                        var name,
                        params = [];
                        sig = StringUtil.trim(sig.split(' ').slice(1).join(''));
                        if (sig.indexOf('(') != -1) {
                            name = sig.slice(0, sig.indexOf('('));
                            params = ParseUtil.split(
                            sig.slice(sig.indexOf('(') + 1, sig.length - 1),
                                ',').map(function (param) {
                                var name, value = null;
                                //Check for a default value
                                if (param.indexOf('=') != -1) {
                                    name = StringUtil.trim(param.slice(0, param.indexOf('=')));
                                    value = StringUtil.trim(param.slice(param.indexOf('=') + 1));
                                    if (value.charAt(0) == '"' || value.charAt(0) == "'") {
                                        value = value.slice(1, value.length - 1);
                                    }
                                } else {
                                    name = param;
                                }
                                return {
                                    name: name,
                                    value: value
                                }
                            });
                        } else {
                            name = sig;
                        }
                        return {
                            type: 'subdef',
                            name: name,
                            parameters: params,
                            body: elm.parseSelectors(body)
                        };
                }
                return name;
            });
        },
        createConstructor: function (definition, root) {
            if (root === undefined) root = true;
            return function (args, self, fireReady) {
                var frame = {},
                i;
                if (fireReady === undefined) fireReady = true;
                for (i = 0; i < definition.parameters.length; i++) {
                    if (args[i] !== undefined) {
                        frame[definition.parameters[i].name] = args[i];
                    } else {
                        frame[definition.parameters[i].name] = definition.parameters[i].value
                    }
                }

                definition.body.forEach(function (selector) {
                    //try {
                        self = elm.applySelectorTo(self, selector, frame, null, root);
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
                // Add getStyle, setStyle, applyStyle function
                self.getStyle = function(name,prop) {
                    var style = self.__styles__[name];
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
                    var style = self.__styles__[name];
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
        applySelectorTo: function (__el__, __selector__, __frame__, parent, root) {
            // All of these underscores are to avoid namespace pollution...
            // These local variables will be closed under eval(), so we need
            // to make them as hard to access as possible.
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
                    for (var prop in __frame__) {
                        __el__[prop] = __frame__[prop];
                    }
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
                case 'extensor':
                    __selector__.supers.forEach(function (s) {
                        elm.extend(__el__, s);
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
                    var $this = $(__el__);
                    var $parent = $(parent);
                    var $root = $(root);
                    $(__el__).bind(__selector__.event, function () {
                        var __args__ = elm._argarr(arguments);
                        var ____func = 'var __func__ = function(' + __selector__.parameters.join(',') + ') { ';
                        ____func += __selector__.body;
                        ____func += '}';
                        eval(____func);
                        __func__.apply(__el__, __args__);
                    });
                    break;
                case 'constructor':
                    var $this = $(__el__);
                    var $parent = $(parent);
                    var $root = $(root);
                    var ____func = 'var __constructor__ = function() { ';
                    ____func += (__selector__.body && __selector__.body.length > 0) ? __selector__.body : '';
                    ____func += '}';
                    try {
                        eval(____func);
                        if(!__el__.____constructors) __el__.____constructors = [];
                        __el__.____constructors.push(__constructor__);
                    } catch (e) {}
                    break;
                case 'method':
                    var $this = $(__el__);
                    var $parent = $(parent);
                    var $root = $(root);
                    var ____func = 'var __method__ = function(' + __selector__.parameters.join(',') + ') {';
                    ____func += __selector__.body;
                    ____func += '}';
                    eval(____func);
                    __el__[__selector__.name] = __method__;
                    break;
                case 'subselector':
                    $(__el__).find(__selector__.cssSelector).each(function (i, e) {
                        __selector__.body.forEach(function (block) {
                            elm.applySelectorTo(e, block, __frame__, __el__, root);
                        });
                    });
                    break;
                case 'subdef':
                    __el__.__definitions[__selector__.name] = elm.createConstructor(__selector__, root);
                    $(__el__).find('.' + __selector__.name).each(function (i, e) {
                        __selector__.body.forEach(function (block) {
                            elm.applySelectorTo(e, block, __frame__, __el__, root);
                        });
                        e.$ = $(e);
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
            };
            return __el__;
        }
    };

    var seeIfLoaded = function () {
        console.log('seeIfLoaded');
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