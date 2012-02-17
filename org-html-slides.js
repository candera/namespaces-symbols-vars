var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  value = parseInt(value, 10);
  precision = 0;
  return goog.string.format.demuxes_["f"](value, flags, width, dotp, precision, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.debug.RelativeTimeProvider");
goog.debug.RelativeTimeProvider = function() {
  this.relativeTimeStart_ = goog.now()
};
goog.debug.RelativeTimeProvider.defaultInstance_ = new goog.debug.RelativeTimeProvider;
goog.debug.RelativeTimeProvider.prototype.set = function(timeStamp) {
  this.relativeTimeStart_ = timeStamp
};
goog.debug.RelativeTimeProvider.prototype.reset = function() {
  this.set(goog.now())
};
goog.debug.RelativeTimeProvider.prototype.get = function() {
  return this.relativeTimeStart_
};
goog.debug.RelativeTimeProvider.getDefaultInstance = function() {
  return goog.debug.RelativeTimeProvider.defaultInstance_
};
goog.provide("goog.debug.Formatter");
goog.provide("goog.debug.HtmlFormatter");
goog.provide("goog.debug.TextFormatter");
goog.require("goog.debug.RelativeTimeProvider");
goog.require("goog.string");
goog.debug.Formatter = function(opt_prefix) {
  this.prefix_ = opt_prefix || "";
  this.startTimeProvider_ = goog.debug.RelativeTimeProvider.getDefaultInstance()
};
goog.debug.Formatter.prototype.showAbsoluteTime = true;
goog.debug.Formatter.prototype.showRelativeTime = true;
goog.debug.Formatter.prototype.showLoggerName = true;
goog.debug.Formatter.prototype.showExceptionText = false;
goog.debug.Formatter.prototype.showSeverityLevel = false;
goog.debug.Formatter.prototype.formatRecord = goog.abstractMethod;
goog.debug.Formatter.prototype.setStartTimeProvider = function(provider) {
  this.startTimeProvider_ = provider
};
goog.debug.Formatter.prototype.getStartTimeProvider = function() {
  return this.startTimeProvider_
};
goog.debug.Formatter.prototype.resetRelativeTimeStart = function() {
  this.startTimeProvider_.reset()
};
goog.debug.Formatter.getDateTimeStamp_ = function(logRecord) {
  var time = new Date(logRecord.getMillis());
  return goog.debug.Formatter.getTwoDigitString_(time.getFullYear() - 2E3) + goog.debug.Formatter.getTwoDigitString_(time.getMonth() + 1) + goog.debug.Formatter.getTwoDigitString_(time.getDate()) + " " + goog.debug.Formatter.getTwoDigitString_(time.getHours()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getMinutes()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getSeconds()) + "." + goog.debug.Formatter.getTwoDigitString_(Math.floor(time.getMilliseconds() / 10))
};
goog.debug.Formatter.getTwoDigitString_ = function(n) {
  if(n < 10) {
    return"0" + n
  }
  return String(n)
};
goog.debug.Formatter.getRelativeTime_ = function(logRecord, relativeTimeStart) {
  var ms = logRecord.getMillis() - relativeTimeStart;
  var sec = ms / 1E3;
  var str = sec.toFixed(3);
  var spacesToPrepend = 0;
  if(sec < 1) {
    spacesToPrepend = 2
  }else {
    while(sec < 100) {
      spacesToPrepend++;
      sec *= 10
    }
  }
  while(spacesToPrepend-- > 0) {
    str = " " + str
  }
  return str
};
goog.debug.HtmlFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix)
};
goog.inherits(goog.debug.HtmlFormatter, goog.debug.Formatter);
goog.debug.HtmlFormatter.prototype.showExceptionText = true;
goog.debug.HtmlFormatter.prototype.formatRecord = function(logRecord) {
  var className;
  switch(logRecord.getLevel().value) {
    case goog.debug.Logger.Level.SHOUT.value:
      className = "dbg-sh";
      break;
    case goog.debug.Logger.Level.SEVERE.value:
      className = "dbg-sev";
      break;
    case goog.debug.Logger.Level.WARNING.value:
      className = "dbg-w";
      break;
    case goog.debug.Logger.Level.INFO.value:
      className = "dbg-i";
      break;
    case goog.debug.Logger.Level.FINE.value:
    ;
    default:
      className = "dbg-f";
      break
  }
  var sb = [];
  sb.push(this.prefix_, " ");
  if(this.showAbsoluteTime) {
    sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ")
  }
  if(this.showRelativeTime) {
    sb.push("[", goog.string.whitespaceEscape(goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get())), "s] ")
  }
  if(this.showLoggerName) {
    sb.push("[", goog.string.htmlEscape(logRecord.getLoggerName()), "] ")
  }
  sb.push('<span class="', className, '">', goog.string.newLineToBr(goog.string.whitespaceEscape(goog.string.htmlEscape(logRecord.getMessage()))));
  if(this.showExceptionText && logRecord.getException()) {
    sb.push("<br>", goog.string.newLineToBr(goog.string.whitespaceEscape(logRecord.getExceptionText() || "")))
  }
  sb.push("</span><br>");
  return sb.join("")
};
goog.debug.TextFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix)
};
goog.inherits(goog.debug.TextFormatter, goog.debug.Formatter);
goog.debug.TextFormatter.prototype.formatRecord = function(logRecord) {
  var sb = [];
  sb.push(this.prefix_, " ");
  if(this.showAbsoluteTime) {
    sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ")
  }
  if(this.showRelativeTime) {
    sb.push("[", goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get()), "s] ")
  }
  if(this.showLoggerName) {
    sb.push("[", logRecord.getLoggerName(), "] ")
  }
  if(this.showSeverityLevel) {
    sb.push("[", logRecord.getLevel().name, "] ")
  }
  sb.push(logRecord.getMessage(), "\n");
  if(this.showExceptionText && logRecord.getException()) {
    sb.push(logRecord.getExceptionText(), "\n")
  }
  return sb.join("")
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.require("goog.asserts");
goog.require("goog.string");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    value = value;
    for(var j = 0;j < value.length;j++) {
      pairs.push("&", key);
      if(value[j] !== "") {
        pairs.push("=", goog.string.urlEncode(value[j]))
      }
    }
  }else {
    if(value != null) {
      pairs.push("&", key);
      if(value !== "") {
        pairs.push("=", goog.string.urlEncode(value))
      }
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ? opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_)
    }
  }
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  if(this.cachedToString_) {
    return this.cachedToString_
  }
  var out = [];
  if(this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  if(this.domain_) {
    out.push("//");
    if(this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.Uri.encodeString_(this.domain_));
    if(this.port_ != null) {
      out.push(":", String(this.getPort()))
    }
  }
  if(this.path_) {
    if(this.hasDomain() && this.path_.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(this.path_, goog.Uri.reDisallowedInPath_))
  }
  var query = String(this.queryData_);
  if(query) {
    out.push("?", query)
  }
  if(this.fragment_) {
    out.push("#", goog.Uri.encodeSpecialChars_(this.fragment_, goog.Uri.reDisallowedInFragment_))
  }
  return this.cachedToString_ = out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_, this.port_, this.path_, this.queryData_.clone(), this.fragment_, this.ignoreCase_)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, this, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeString_ = function(unescapedPart) {
  if(goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart)
  }
  return null
};
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if(goog.isString(unescapedPart)) {
    ret = unescapedPart;
    if(!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart)
    }
    if(ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_)
    }
  }
  return ret
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInPath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.uri_ = opt_uri || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  return goog.Uri.QueryData.createFromKeysValues(keys, goog.structs.getValues(map), opt_uri, opt_ignoreCase)
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.decodedQuery_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(!this.containsKey(key)) {
    this.keyMap_.set(key, value)
  }else {
    var current = this.keyMap_.get(key);
    if(goog.isArray(current)) {
      current.push(value)
    }else {
      this.keyMap_.set(key, [current, value])
    }
  }
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if(this.keyMap_) {
    this.keyMap_.clear()
  }
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        rv.push(keys[i])
      }
    }else {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if(opt_key) {
    var key = this.getKeyName_(opt_key);
    if(this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if(goog.isArray(value)) {
        return value
      }else {
        rv = [];
        rv.push(value)
      }
    }else {
      rv = []
    }
  }else {
    var vals = this.keyMap_.getValues();
    rv = [];
    for(var i = 0;i < vals.length;i++) {
      var val = vals[i];
      if(goog.isArray(val)) {
        goog.array.extend(rv, val)
      }else {
        rv.push(val)
      }
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  this.keyMap_.set(key, value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      return val[0]
    }else {
      return val
    }
  }else {
    return opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  if(values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        if(count > 0) {
          sb.push("&")
        }
        sb.push(encodedKey);
        if(val[j] !== "") {
          sb.push("=", goog.string.urlEncode(val[j]))
        }
        count++
      }
    }else {
      if(count > 0) {
        sb.push("&")
      }
      sb.push(encodedKey);
      if(val !== "") {
        sb.push("=", goog.string.urlEncode(val))
      }
      count++
    }
  }
  return this.encodedQuery_ = sb.join("")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if(!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString())
  }
  return this.decodedQuery_
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if(this.uri_) {
    delete this.uri_.cachedToString_
  }
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  if(this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_
  }
  if(this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_
  }
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
  }
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyCodes = {MAC_ENTER:3, BACKSPACE:8, TAB:9, NUM_CENTER:12, ENTER:13, SHIFT:16, CTRL:17, ALT:18, PAUSE:19, CAPS_LOCK:20, ESC:27, SPACE:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36, LEFT:37, UP:38, RIGHT:39, DOWN:40, PRINT_SCREEN:44, INSERT:45, DELETE:46, ZERO:48, ONE:49, TWO:50, THREE:51, FOUR:52, FIVE:53, SIX:54, SEVEN:55, EIGHT:56, NINE:57, QUESTION_MARK:63, A:65, B:66, C:67, D:68, E:69, F:70, G:71, H:72, I:73, J:74, K:75, L:76, M:77, N:78, O:79, P:80, Q:81, R:82, S:83, T:84, U:85, 
V:86, W:87, X:88, Y:89, Z:90, META:91, CONTEXT_MENU:93, NUM_ZERO:96, NUM_ONE:97, NUM_TWO:98, NUM_THREE:99, NUM_FOUR:100, NUM_FIVE:101, NUM_SIX:102, NUM_SEVEN:103, NUM_EIGHT:104, NUM_NINE:105, NUM_MULTIPLY:106, NUM_PLUS:107, NUM_MINUS:109, NUM_PERIOD:110, NUM_DIVISION:111, F1:112, F2:113, F3:114, F4:115, F5:116, F6:117, F7:118, F8:119, F9:120, F10:121, F11:122, F12:123, NUMLOCK:144, SEMICOLON:186, DASH:189, EQUALS:187, COMMA:188, PERIOD:190, SLASH:191, APOSTROPHE:192, SINGLE_QUOTE:222, OPEN_SQUARE_BRACKET:219, 
BACKSLASH:220, CLOSE_SQUARE_BRACKET:221, WIN_KEY:224, MAC_FF_META:224, WIN_IME:229, PHANTOM:255};
goog.events.KeyCodes.isTextModifyingKeyEvent = function(e) {
  if(e.altKey && !e.ctrlKey || e.metaKey || e.keyCode >= goog.events.KeyCodes.F1 && e.keyCode <= goog.events.KeyCodes.F12) {
    return false
  }
  switch(e.keyCode) {
    case goog.events.KeyCodes.ALT:
    ;
    case goog.events.KeyCodes.CAPS_LOCK:
    ;
    case goog.events.KeyCodes.CONTEXT_MENU:
    ;
    case goog.events.KeyCodes.CTRL:
    ;
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.END:
    ;
    case goog.events.KeyCodes.ESC:
    ;
    case goog.events.KeyCodes.HOME:
    ;
    case goog.events.KeyCodes.INSERT:
    ;
    case goog.events.KeyCodes.LEFT:
    ;
    case goog.events.KeyCodes.MAC_FF_META:
    ;
    case goog.events.KeyCodes.META:
    ;
    case goog.events.KeyCodes.NUMLOCK:
    ;
    case goog.events.KeyCodes.NUM_CENTER:
    ;
    case goog.events.KeyCodes.PAGE_DOWN:
    ;
    case goog.events.KeyCodes.PAGE_UP:
    ;
    case goog.events.KeyCodes.PAUSE:
    ;
    case goog.events.KeyCodes.PHANTOM:
    ;
    case goog.events.KeyCodes.PRINT_SCREEN:
    ;
    case goog.events.KeyCodes.RIGHT:
    ;
    case goog.events.KeyCodes.SHIFT:
    ;
    case goog.events.KeyCodes.UP:
    ;
    case goog.events.KeyCodes.WIN_KEY:
      return false;
    default:
      return true
  }
};
goog.events.KeyCodes.firesKeyPressEvent = function(keyCode, opt_heldKeyCode, opt_shiftKey, opt_ctrlKey, opt_altKey) {
  if(!goog.userAgent.IE && !(goog.userAgent.WEBKIT && goog.userAgent.isVersion("525"))) {
    return true
  }
  if(goog.userAgent.MAC && opt_altKey) {
    return goog.events.KeyCodes.isCharacterKey(keyCode)
  }
  if(opt_altKey && !opt_ctrlKey) {
    return false
  }
  if(!opt_shiftKey && (opt_heldKeyCode == goog.events.KeyCodes.CTRL || opt_heldKeyCode == goog.events.KeyCodes.ALT)) {
    return false
  }
  if(goog.userAgent.IE && opt_ctrlKey && opt_heldKeyCode == keyCode) {
    return false
  }
  switch(keyCode) {
    case goog.events.KeyCodes.ENTER:
      return true;
    case goog.events.KeyCodes.ESC:
      return!goog.userAgent.WEBKIT
  }
  return goog.events.KeyCodes.isCharacterKey(keyCode)
};
goog.events.KeyCodes.isCharacterKey = function(keyCode) {
  if(keyCode >= goog.events.KeyCodes.ZERO && keyCode <= goog.events.KeyCodes.NINE) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.NUM_ZERO && keyCode <= goog.events.KeyCodes.NUM_MULTIPLY) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.A && keyCode <= goog.events.KeyCodes.Z) {
    return true
  }
  if(goog.userAgent.WEBKIT && keyCode == 0) {
    return true
  }
  switch(keyCode) {
    case goog.events.KeyCodes.SPACE:
    ;
    case goog.events.KeyCodes.QUESTION_MARK:
    ;
    case goog.events.KeyCodes.NUM_PLUS:
    ;
    case goog.events.KeyCodes.NUM_MINUS:
    ;
    case goog.events.KeyCodes.NUM_PERIOD:
    ;
    case goog.events.KeyCodes.NUM_DIVISION:
    ;
    case goog.events.KeyCodes.SEMICOLON:
    ;
    case goog.events.KeyCodes.DASH:
    ;
    case goog.events.KeyCodes.EQUALS:
    ;
    case goog.events.KeyCodes.COMMA:
    ;
    case goog.events.KeyCodes.PERIOD:
    ;
    case goog.events.KeyCodes.SLASH:
    ;
    case goog.events.KeyCodes.APOSTROPHE:
    ;
    case goog.events.KeyCodes.SINGLE_QUOTE:
    ;
    case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
    ;
    case goog.events.KeyCodes.BACKSLASH:
    ;
    case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      return true;
    default:
      return false
  }
};
goog.provide("goog.events.KeyEvent");
goog.provide("goog.events.KeyHandler");
goog.provide("goog.events.KeyHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyHandler = function(opt_element, opt_capture) {
  goog.events.EventTarget.call(this);
  if(opt_element) {
    this.attach(opt_element, opt_capture)
  }
};
goog.inherits(goog.events.KeyHandler, goog.events.EventTarget);
goog.events.KeyHandler.prototype.element_ = null;
goog.events.KeyHandler.prototype.keyPressKey_ = null;
goog.events.KeyHandler.prototype.keyDownKey_ = null;
goog.events.KeyHandler.prototype.keyUpKey_ = null;
goog.events.KeyHandler.prototype.lastKey_ = -1;
goog.events.KeyHandler.prototype.keyCode_ = -1;
goog.events.KeyHandler.EventType = {KEY:"key"};
goog.events.KeyHandler.safariKey_ = {3:goog.events.KeyCodes.ENTER, 12:goog.events.KeyCodes.NUMLOCK, 63232:goog.events.KeyCodes.UP, 63233:goog.events.KeyCodes.DOWN, 63234:goog.events.KeyCodes.LEFT, 63235:goog.events.KeyCodes.RIGHT, 63236:goog.events.KeyCodes.F1, 63237:goog.events.KeyCodes.F2, 63238:goog.events.KeyCodes.F3, 63239:goog.events.KeyCodes.F4, 63240:goog.events.KeyCodes.F5, 63241:goog.events.KeyCodes.F6, 63242:goog.events.KeyCodes.F7, 63243:goog.events.KeyCodes.F8, 63244:goog.events.KeyCodes.F9, 
63245:goog.events.KeyCodes.F10, 63246:goog.events.KeyCodes.F11, 63247:goog.events.KeyCodes.F12, 63248:goog.events.KeyCodes.PRINT_SCREEN, 63272:goog.events.KeyCodes.DELETE, 63273:goog.events.KeyCodes.HOME, 63275:goog.events.KeyCodes.END, 63276:goog.events.KeyCodes.PAGE_UP, 63277:goog.events.KeyCodes.PAGE_DOWN, 63289:goog.events.KeyCodes.NUMLOCK, 63302:goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.keyIdentifier_ = {"Up":goog.events.KeyCodes.UP, "Down":goog.events.KeyCodes.DOWN, "Left":goog.events.KeyCodes.LEFT, "Right":goog.events.KeyCodes.RIGHT, "Enter":goog.events.KeyCodes.ENTER, "F1":goog.events.KeyCodes.F1, "F2":goog.events.KeyCodes.F2, "F3":goog.events.KeyCodes.F3, "F4":goog.events.KeyCodes.F4, "F5":goog.events.KeyCodes.F5, "F6":goog.events.KeyCodes.F6, "F7":goog.events.KeyCodes.F7, "F8":goog.events.KeyCodes.F8, "F9":goog.events.KeyCodes.F9, "F10":goog.events.KeyCodes.F10, 
"F11":goog.events.KeyCodes.F11, "F12":goog.events.KeyCodes.F12, "U+007F":goog.events.KeyCodes.DELETE, "Home":goog.events.KeyCodes.HOME, "End":goog.events.KeyCodes.END, "PageUp":goog.events.KeyCodes.PAGE_UP, "PageDown":goog.events.KeyCodes.PAGE_DOWN, "Insert":goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_ = {61:187, 59:186};
goog.events.KeyHandler.USES_KEYDOWN_ = goog.userAgent.IE || goog.userAgent.WEBKIT && goog.userAgent.isVersion("525");
goog.events.KeyHandler.prototype.handleKeyDown_ = function(e) {
  if(goog.userAgent.WEBKIT && (this.lastKey_ == goog.events.KeyCodes.CTRL && !e.ctrlKey || this.lastKey_ == goog.events.KeyCodes.ALT && !e.altKey)) {
    this.lastKey_ = -1;
    this.keyCode_ = -1
  }
  if(goog.events.KeyHandler.USES_KEYDOWN_ && !goog.events.KeyCodes.firesKeyPressEvent(e.keyCode, this.lastKey_, e.shiftKey, e.ctrlKey, e.altKey)) {
    this.handleEvent(e)
  }else {
    if(goog.userAgent.GECKO && e.keyCode in goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_) {
      this.keyCode_ = goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_[e.keyCode]
    }else {
      this.keyCode_ = e.keyCode
    }
  }
};
goog.events.KeyHandler.prototype.handleKeyup_ = function(e) {
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var keyCode, charCode;
  if(goog.userAgent.IE && e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = keyCode != goog.events.KeyCodes.ENTER && keyCode != goog.events.KeyCodes.ESC ? be.keyCode : 0
  }else {
    if(goog.userAgent.WEBKIT && e.type == goog.events.EventType.KEYPRESS) {
      keyCode = this.keyCode_;
      charCode = be.charCode >= 0 && be.charCode < 63232 && goog.events.KeyCodes.isCharacterKey(keyCode) ? be.charCode : 0
    }else {
      if(goog.userAgent.OPERA) {
        keyCode = this.keyCode_;
        charCode = goog.events.KeyCodes.isCharacterKey(keyCode) ? be.keyCode : 0
      }else {
        keyCode = be.keyCode || this.keyCode_;
        charCode = be.charCode || 0;
        if(goog.userAgent.MAC && charCode == goog.events.KeyCodes.QUESTION_MARK && !keyCode) {
          keyCode = goog.events.KeyCodes.SLASH
        }
      }
    }
  }
  var key = keyCode;
  var keyIdentifier = be.keyIdentifier;
  if(keyCode) {
    if(keyCode >= 63232 && keyCode in goog.events.KeyHandler.safariKey_) {
      key = goog.events.KeyHandler.safariKey_[keyCode]
    }else {
      if(keyCode == 25 && e.shiftKey) {
        key = 9
      }
    }
  }else {
    if(keyIdentifier && keyIdentifier in goog.events.KeyHandler.keyIdentifier_) {
      key = goog.events.KeyHandler.keyIdentifier_[keyIdentifier]
    }
  }
  var repeat = key == this.lastKey_;
  this.lastKey_ = key;
  var event = new goog.events.KeyEvent(key, charCode, repeat, be);
  try {
    this.dispatchEvent(event)
  }finally {
    event.dispose()
  }
};
goog.events.KeyHandler.prototype.getElement = function() {
  return this.element_
};
goog.events.KeyHandler.prototype.attach = function(element, opt_capture) {
  if(this.keyUpKey_) {
    this.detach()
  }
  this.element_ = element;
  this.keyPressKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYPRESS, this, opt_capture);
  this.keyDownKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYDOWN, this.handleKeyDown_, opt_capture, this);
  this.keyUpKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYUP, this.handleKeyup_, opt_capture, this)
};
goog.events.KeyHandler.prototype.detach = function() {
  if(this.keyPressKey_) {
    goog.events.unlistenByKey(this.keyPressKey_);
    goog.events.unlistenByKey(this.keyDownKey_);
    goog.events.unlistenByKey(this.keyUpKey_);
    this.keyPressKey_ = null;
    this.keyDownKey_ = null;
    this.keyUpKey_ = null
  }
  this.element_ = null;
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.disposeInternal = function() {
  goog.events.KeyHandler.superClass_.disposeInternal.call(this);
  this.detach()
};
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyHandler.EventType.KEY;
  this.keyCode = keyCode;
  this.charCode = charCode;
  this.repeat = repeat
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return Boolean(opt_cancel)
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.getFunctionName = function(fn) {
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.logToSpeedTracer_ = function(msg) {
  if(goog.global["console"] && goog.global["console"]["markTimeline"]) {
    goog.global["console"]["markTimeline"](msg)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  this.logToSpeedTracer_("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.structs.CircularBuffer");
goog.structs.CircularBuffer = function(opt_maxSize) {
  this.maxSize_ = opt_maxSize || 100;
  this.buff_ = []
};
goog.structs.CircularBuffer.prototype.nextPtr_ = 0;
goog.structs.CircularBuffer.prototype.add = function(item) {
  this.buff_[this.nextPtr_] = item;
  this.nextPtr_ = (this.nextPtr_ + 1) % this.maxSize_
};
goog.structs.CircularBuffer.prototype.get = function(index) {
  index = this.normalizeIndex_(index);
  return this.buff_[index]
};
goog.structs.CircularBuffer.prototype.set = function(index, item) {
  index = this.normalizeIndex_(index);
  this.buff_[index] = item
};
goog.structs.CircularBuffer.prototype.getCount = function() {
  return this.buff_.length
};
goog.structs.CircularBuffer.prototype.isEmpty = function() {
  return this.buff_.length == 0
};
goog.structs.CircularBuffer.prototype.clear = function() {
  this.buff_.length = 0;
  this.nextPtr_ = 0
};
goog.structs.CircularBuffer.prototype.getValues = function() {
  return this.getNewestValues(this.getCount())
};
goog.structs.CircularBuffer.prototype.getNewestValues = function(maxCount) {
  var l = this.getCount();
  var start = this.getCount() - maxCount;
  var rv = [];
  for(var i = start;i < l;i++) {
    rv[i] = this.get(i)
  }
  return rv
};
goog.structs.CircularBuffer.prototype.getKeys = function() {
  var rv = [];
  var l = this.getCount();
  for(var i = 0;i < l;i++) {
    rv[i] = i
  }
  return rv
};
goog.structs.CircularBuffer.prototype.containsKey = function(key) {
  return key < this.getCount()
};
goog.structs.CircularBuffer.prototype.containsValue = function(value) {
  var l = this.getCount();
  for(var i = 0;i < l;i++) {
    if(this.get(i) == value) {
      return true
    }
  }
  return false
};
goog.structs.CircularBuffer.prototype.getLast = function() {
  if(this.getCount() == 0) {
    return null
  }
  return this.get(this.getCount() - 1)
};
goog.structs.CircularBuffer.prototype.normalizeIndex_ = function(index) {
  if(index >= this.buff_.length) {
    throw Error("Out of bounds exception");
  }
  if(this.buff_.length < this.maxSize_) {
    return index
  }
  return(this.nextPtr_ + Number(index)) % this.maxSize_
};
goog.provide("goog.debug.DebugWindow");
goog.require("goog.debug.HtmlFormatter");
goog.require("goog.debug.LogManager");
goog.require("goog.structs.CircularBuffer");
goog.require("goog.userAgent");
goog.debug.DebugWindow = function(opt_identifier, opt_prefix) {
  this.identifier_ = opt_identifier || "";
  this.prefix_ = opt_prefix || "";
  this.outputBuffer_ = [];
  this.savedMessages_ = new goog.structs.CircularBuffer(goog.debug.DebugWindow.MAX_SAVED);
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.HtmlFormatter(this.prefix_);
  this.filteredLoggers_ = {};
  this.setCapturing(true);
  this.enabled_ = goog.debug.DebugWindow.isEnabled(this.identifier_);
  goog.global.setInterval(goog.bind(this.saveWindowPositionSize_, this), 7500)
};
goog.debug.DebugWindow.MAX_SAVED = 500;
goog.debug.DebugWindow.COOKIE_TIME = 30 * 24 * 60 * 60 * 1E3;
goog.debug.DebugWindow.prototype.welcomeMessage = "LOGGING";
goog.debug.DebugWindow.prototype.enableOnSevere_ = false;
goog.debug.DebugWindow.prototype.win_ = null;
goog.debug.DebugWindow.prototype.winOpening_ = false;
goog.debug.DebugWindow.prototype.isCapturing_ = false;
goog.debug.DebugWindow.showedBlockedAlert_ = false;
goog.debug.DebugWindow.prototype.bufferTimeout_ = null;
goog.debug.DebugWindow.prototype.lastCall_ = goog.now();
goog.debug.DebugWindow.prototype.setWelcomeMessage = function(msg) {
  this.welcomeMessage = msg
};
goog.debug.DebugWindow.prototype.init = function() {
  if(this.enabled_) {
    this.openWindow_()
  }
};
goog.debug.DebugWindow.prototype.isEnabled = function() {
  return this.enabled_
};
goog.debug.DebugWindow.prototype.setEnabled = function(enable) {
  this.enabled_ = enable;
  if(this.enabled_) {
    this.openWindow_();
    if(this.win_) {
      this.writeInitialDocument_()
    }
  }
  this.setCookie_("enabled", enable ? "1" : "0")
};
goog.debug.DebugWindow.prototype.setForceEnableOnSevere = function(enableOnSevere) {
  this.enableOnSevere_ = enableOnSevere
};
goog.debug.DebugWindow.prototype.isCapturing = function() {
  return this.isCapturing_
};
goog.debug.DebugWindow.prototype.setCapturing = function(capturing) {
  if(capturing == this.isCapturing_) {
    return
  }
  this.isCapturing_ = capturing;
  var rootLogger = goog.debug.LogManager.getRoot();
  if(capturing) {
    rootLogger.addHandler(this.publishHandler_)
  }else {
    rootLogger.removeHandler(this.publishHandler_)
  }
};
goog.debug.DebugWindow.prototype.getFormatter = function() {
  return this.formatter_
};
goog.debug.DebugWindow.prototype.setFormatter = function(formatter) {
  this.formatter_ = formatter
};
goog.debug.DebugWindow.prototype.addSeparator = function() {
  this.write_("<hr>")
};
goog.debug.DebugWindow.prototype.hasActiveWindow = function() {
  return!!this.win_ && !this.win_.closed
};
goog.debug.DebugWindow.prototype.clear_ = function() {
  this.savedMessages_.clear();
  if(this.hasActiveWindow()) {
    this.writeInitialDocument_()
  }
};
goog.debug.DebugWindow.prototype.addLogRecord = function(logRecord) {
  if(this.filteredLoggers_[logRecord.getLoggerName()]) {
    return
  }
  if(this.enableOnSevere_ && logRecord.getLevel() >= goog.debug.Logger.Level.SEVERE) {
    this.setEnabled(true)
  }
  var html = this.formatter_.formatRecord(logRecord);
  this.write_(html)
};
goog.debug.DebugWindow.prototype.write_ = function(html) {
  if(this.enabled_) {
    this.openWindow_();
    this.savedMessages_.add(html);
    this.writeToLog_(html)
  }else {
    this.savedMessages_.add(html)
  }
};
goog.debug.DebugWindow.prototype.writeToLog_ = function(html) {
  this.outputBuffer_.push(html);
  goog.global.clearTimeout(this.bufferTimeout_);
  if(goog.now() - this.lastCall_ > 750) {
    this.writeBufferToLog_()
  }else {
    this.bufferTimeout_ = goog.global.setTimeout(goog.bind(this.writeBufferToLog_, this), 250)
  }
};
goog.debug.DebugWindow.prototype.writeBufferToLog_ = function() {
  this.lastCall_ = goog.now();
  if(this.hasActiveWindow()) {
    var body = this.win_.document.body;
    var scroll = body && body.scrollHeight - (body.scrollTop + body.clientHeight) <= 100;
    this.win_.document.write(this.outputBuffer_.join(""));
    this.outputBuffer_.length = 0;
    if(scroll) {
      this.win_.scrollTo(0, 1E6)
    }
  }
};
goog.debug.DebugWindow.prototype.writeSavedMessages_ = function() {
  var messages = this.savedMessages_.getValues();
  for(var i = 0;i < messages.length;i++) {
    this.writeToLog_(messages[i])
  }
};
goog.debug.DebugWindow.prototype.openWindow_ = function() {
  if(this.hasActiveWindow() || this.winOpening_) {
    return
  }
  var winpos = this.getCookie_("dbg", "0,0,800,500").split(",");
  var x = Number(winpos[0]);
  var y = Number(winpos[1]);
  var w = Number(winpos[2]);
  var h = Number(winpos[3]);
  this.winOpening_ = true;
  this.win_ = window.open("", this.getWindowName_(), "width=" + w + ",height=" + h + ",toolbar=no,resizable=yes," + "scrollbars=yes,left=" + x + ",top=" + y + ",status=no,screenx=" + x + ",screeny=" + y);
  if(!this.win_) {
    if(!this.showedBlockedAlert_) {
      alert("Logger popup was blocked");
      this.showedBlockedAlert_ = true
    }
  }
  this.winOpening_ = false;
  if(this.win_) {
    this.writeInitialDocument_()
  }
};
goog.debug.DebugWindow.prototype.getWindowName_ = function() {
  return goog.userAgent.IE ? this.identifier_.replace(/[\s\-\.\,]/g, "_") : this.identifier_
};
goog.debug.DebugWindow.prototype.getStyleRules = function() {
  return"*{font:normal 14px monospace;}" + ".dbg-sev{color:#F00}" + ".dbg-w{color:#E92}" + ".dbg-sh{background-color:#fd4;font-weight:bold;color:#000}" + ".dbg-i{color:#666}" + ".dbg-f{color:#999}" + ".dbg-ev{color:#0A0}" + ".dbg-m{color:#990}"
};
goog.debug.DebugWindow.prototype.writeInitialDocument_ = function() {
  if(this.hasActiveWindow()) {
    return
  }
  this.win_.document.open();
  var html = "<style>" + this.getStyleRules() + "</style>" + '<hr><div class="dbg-ev" style="text-align:center">' + this.welcomeMessage + "<br><small>Logger: " + this.identifier_ + "</small></div><hr>";
  this.writeToLog_(html);
  this.writeSavedMessages_()
};
goog.debug.DebugWindow.prototype.setCookie_ = function(key, value) {
  key += this.identifier_;
  document.cookie = key + "=" + encodeURIComponent(value) + ";path=/;expires=" + (new Date(goog.now() + goog.debug.DebugWindow.COOKIE_TIME)).toUTCString()
};
goog.debug.DebugWindow.prototype.getCookie_ = function(key, opt_default) {
  return goog.debug.DebugWindow.getCookieValue_(this.identifier_, key, opt_default)
};
goog.debug.DebugWindow.getCookieValue_ = function(identifier, key, opt_default) {
  var fullKey = key + identifier;
  var cookie = String(document.cookie);
  var start = cookie.indexOf(fullKey + "=");
  if(start != -1) {
    var end = cookie.indexOf(";", start);
    return decodeURIComponent(cookie.substring(start + fullKey.length + 1, end == -1 ? cookie.length : end))
  }else {
    return opt_default || ""
  }
};
goog.debug.DebugWindow.isEnabled = function(identifier) {
  return goog.debug.DebugWindow.getCookieValue_(identifier, "enabled") == "1"
};
goog.debug.DebugWindow.prototype.saveWindowPositionSize_ = function() {
  if(!this.hasActiveWindow()) {
    return
  }
  var x = this.win_.screenX || this.win_.screenLeft || 0;
  var y = this.win_.screenY || this.win_.screenTop || 0;
  var w = this.win_.outerWidth || 800;
  var h = this.win_.outerHeight || 500;
  this.setCookie_("dbg", x + "," + y + "," + w + "," + h)
};
goog.debug.DebugWindow.prototype.addFilter = function(loggerName) {
  this.filteredLoggers_[loggerName] = 1
};
goog.debug.DebugWindow.prototype.removeFilter = function(loggerName) {
  delete this.filteredLoggers_[loggerName]
};
goog.provide("goog.debug.FancyWindow");
goog.require("goog.debug.DebugWindow");
goog.require("goog.debug.LogManager");
goog.require("goog.debug.Logger");
goog.require("goog.debug.Logger.Level");
goog.require("goog.dom.DomHelper");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.debug.FancyWindow = function(opt_identifier, opt_prefix) {
  goog.debug.DebugWindow.call(this, opt_identifier, opt_prefix)
};
goog.inherits(goog.debug.FancyWindow, goog.debug.DebugWindow);
goog.debug.FancyWindow.prototype.writeBufferToLog_ = function(html) {
  this.lastCall_ = goog.now();
  if(this.hasActiveWindow()) {
    var logel = this.dh_.getElement("log");
    var scroll = logel.scrollHeight - (logel.scrollTop + logel.offsetHeight) <= 100;
    for(var i = 0;i < this.outputBuffer_.length;i++) {
      var div = this.dh_.createDom("div", "logmsg");
      div.innerHTML = this.outputBuffer_[i];
      logel.appendChild(div)
    }
    this.outputBuffer_.length = 0;
    this.resizeStuff_();
    if(scroll) {
      logel.scrollTop = logel.scrollHeight
    }
  }
};
goog.debug.FancyWindow.prototype.writeInitialDocument_ = function() {
  if(!this.hasActiveWindow()) {
    return
  }
  var doc = this.win_.document;
  doc.open();
  doc.write(this.getHtml_());
  doc.close();
  (goog.userAgent.IE ? doc.body : this.win_).onresize = goog.bind(this.resizeStuff_, this);
  this.dh_ = new goog.dom.DomHelper(doc);
  this.dh_.getElement("openbutton").onclick = goog.bind(this.openOptions_, this);
  this.dh_.getElement("closebutton").onclick = goog.bind(this.closeOptions_, this);
  this.dh_.getElement("clearbutton").onclick = goog.bind(this.clear_, this);
  this.writeSavedMessages_()
};
goog.debug.FancyWindow.prototype.openOptions_ = function() {
  var el = this.dh_.getElement("optionsarea");
  el.innerHTML = "";
  var loggers = goog.debug.FancyWindow.getLoggers_();
  var dh = this.dh_;
  for(var i = 0;i < loggers.length;i++) {
    var logger = goog.debug.Logger.getLogger(loggers[i]);
    var curlevel = logger.getLevel() ? logger.getLevel().name : "INHERIT";
    var div = dh.createDom("div", {}, this.getDropDown_("sel" + loggers[i], curlevel), dh.createDom("span", {}, loggers[i] || "(root)"));
    el.appendChild(div)
  }
  this.dh_.getElement("options").style.display = "block";
  return false
};
goog.debug.FancyWindow.prototype.getDropDown_ = function(id, selected) {
  var dh = this.dh_;
  var sel = dh.createDom("select", {"id":id});
  var levels = goog.debug.Logger.Level.PREDEFINED_LEVELS;
  for(var i = 0;i < levels.length;i++) {
    var level = levels[i];
    var option = dh.createDom("option", {}, level.name);
    if(selected == level.name) {
      option.selected = true
    }
    sel.appendChild(option)
  }
  sel.appendChild(dh.createDom("option", {"selected":selected == "INHERIT"}, "INHERIT"));
  return sel
};
goog.debug.FancyWindow.prototype.closeOptions_ = function() {
  this.dh_.getElement("options").style.display = "none";
  var loggers = goog.debug.FancyWindow.getLoggers_();
  var dh = this.dh_;
  for(var i = 0;i < loggers.length;i++) {
    var logger = goog.debug.Logger.getLogger(loggers[i]);
    var sel = dh.getElement("sel" + loggers[i]);
    var level = sel.options[sel.selectedIndex].text;
    if(level == "INHERIT") {
      logger.setLevel(null)
    }else {
      logger.setLevel(goog.debug.Logger.Level.getPredefinedLevel(level))
    }
  }
  return false
};
goog.debug.FancyWindow.prototype.resizeStuff_ = function() {
  var dh = this.dh_;
  var logel = dh.getElement("log");
  var headel = dh.getElement("head");
  logel.style.top = headel.offsetHeight + "px";
  logel.style.height = dh.getDocument().body.offsetHeight - headel.offsetHeight - (goog.userAgent.IE ? 4 : 0) + "px"
};
goog.debug.FancyWindow.getLoggers_ = function() {
  var loggers = goog.object.getKeys(goog.debug.LogManager.getLoggers());
  loggers.sort();
  return loggers
};
goog.debug.FancyWindow.prototype.getStyleRules = function() {
  return goog.debug.FancyWindow.superClass_.getStyleRules.call(this) + "html,body{height:100%;width:100%;margin:0px;padding:0px;" + "background-color:#FFF;overflow:hidden}" + "*{}" + ".logmsg{border-bottom:1px solid #CCC;padding:2px;font:medium monospace;}" + "#head{position:absolute;width:100%;font:x-small arial;" + "border-bottom:2px solid #999;background-color:#EEE;}" + "#head p{margin:0px 5px;}" + "#log{position:absolute;width:100%;background-color:#FFF;}" + "#options{position:absolute;right:0px;width:50%;height:100%;border-left:" + 
  "1px solid #999;background-color:#DDD;display:none;padding-left: 5px;" + "font:normal small arial;overflow:auto;}" + "#openbutton,#closebutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:5px;font:x-small arial;}" + "#clearbutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:50px;font:x-small arial;}" + "select{font:x-small arial;margin-right:10px;}" + "hr{border:0;height:5px;background-color:#8c8;color:#8c8;}"
};
goog.debug.FancyWindow.prototype.getHtml_ = function() {
  return"" + '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"' + '"http://www.w3.org/TR/html4/loose.dtd">' + "<html><head><title>Logging: " + this.identifier_ + "</title>" + "<style>" + this.getStyleRules() + "</style>" + "</head><body>" + '<div id="log" style="overflow:auto"></div>' + '<div id="head">' + "<p><b>Logging: " + this.identifier_ + "</b></p><p>" + this.welcomeMessage + "</p>" + '<span id="clearbutton">clear</span>' + '<span id="openbutton">options</span>' + "</div>" + '<div id="options">' + 
  "<big><b>Options:</b></big>" + '<div id="optionsarea"></div>' + '<span id="closebutton">save and close</span>' + "</div>" + "</body></html>"
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.debug.Console");
goog.require("goog.debug.LogManager");
goog.require("goog.debug.Logger.Level");
goog.require("goog.debug.TextFormatter");
goog.debug.Console = function() {
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.TextFormatter;
  this.formatter_.showAbsoluteTime = false;
  this.formatter_.showExceptionText = false;
  this.isCapturing_ = false;
  this.logBuffer_ = ""
};
goog.debug.Console.prototype.getFormatter = function() {
  return this.formatter_
};
goog.debug.Console.prototype.setCapturing = function(capturing) {
  if(capturing == this.isCapturing_) {
    return
  }
  var rootLogger = goog.debug.LogManager.getRoot();
  if(capturing) {
    rootLogger.addHandler(this.publishHandler_)
  }else {
    rootLogger.removeHandler(this.publishHandler_);
    this.logBuffer = ""
  }
  this.isCapturing_ = capturing
};
goog.debug.Console.prototype.addLogRecord = function(logRecord) {
  var record = this.formatter_.formatRecord(logRecord);
  if(window.console && window.console["firebug"]) {
    switch(logRecord.getLevel()) {
      case goog.debug.Logger.Level.SHOUT:
        window.console["info"](record);
        break;
      case goog.debug.Logger.Level.SEVERE:
        window.console["error"](record);
        break;
      case goog.debug.Logger.Level.WARNING:
        window.console["warn"](record);
        break;
      default:
        window.console["debug"](record);
        break
    }
  }else {
    if(window.console) {
      window.console.log(record)
    }else {
      if(window.opera) {
        window.opera["postError"](record)
      }else {
        this.logBuffer_ += record
      }
    }
  }
};
goog.debug.Console.instance = null;
goog.debug.Console.autoInstall = function() {
  if(!goog.debug.Console.instance) {
    goog.debug.Console.instance = new goog.debug.Console
  }
  if(window.location.href.indexOf("Debug=true") != -1) {
    goog.debug.Console.instance.setCapturing(true)
  }
};
goog.debug.Console.show = function() {
  alert(goog.debug.Console.instance.logBuffer_)
};
goog.provide("goog.window");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.window.DEFAULT_POPUP_HEIGHT = 500;
goog.window.DEFAULT_POPUP_WIDTH = 690;
goog.window.DEFAULT_POPUP_TARGET = "google_popup";
goog.window.open = function(linkRef, opt_options, opt_parentWin) {
  if(!opt_options) {
    opt_options = {}
  }
  var parentWin = opt_parentWin || window;
  var href = typeof linkRef.href != "undefined" ? linkRef.href : String(linkRef);
  var target = opt_options.target || linkRef.target;
  var sb = [];
  for(var option in opt_options) {
    switch(option) {
      case "width":
      ;
      case "height":
      ;
      case "top":
      ;
      case "left":
        sb.push(option + "=" + opt_options[option]);
        break;
      case "target":
      ;
      case "noreferrer":
        break;
      default:
        sb.push(option + "=" + (opt_options[option] ? 1 : 0))
    }
  }
  var optionString = sb.join(",");
  var newWin;
  if(opt_options["noreferrer"]) {
    newWin = parentWin.open("", target, optionString);
    if(newWin) {
      if(goog.userAgent.IE) {
        if(href.indexOf(";") != -1) {
          href = "'" + href.replace(/'/g, "%27") + "'"
        }
      }
      href = goog.string.htmlEscape(href);
      newWin.document.write('<META HTTP-EQUIV="refresh" content="0; url=' + href + '">');
      newWin.document.close()
    }
  }else {
    newWin = parentWin.open(href, target, optionString)
  }
  return newWin
};
goog.window.openBlank = function(opt_message, opt_options, opt_parentWin) {
  var loadingMessage = opt_message ? goog.string.htmlEscape(opt_message) : "";
  return goog.window.open('javascript:"' + encodeURI(loadingMessage) + '"', opt_options, opt_parentWin)
};
goog.window.popup = function(linkRef, opt_options) {
  if(!opt_options) {
    opt_options = {}
  }
  opt_options["target"] = opt_options["target"] || linkRef["target"] || goog.window.DEFAULT_POPUP_TARGET;
  opt_options["width"] = opt_options["width"] || goog.window.DEFAULT_POPUP_WIDTH;
  opt_options["height"] = opt_options["height"] || goog.window.DEFAULT_POPUP_HEIGHT;
  var newWin = goog.window.open(linkRef, opt_options);
  if(!newWin) {
    return true
  }
  newWin.focus();
  return false
};
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3693__auto____2876 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3693__auto____2876)) {
    return or__3693__auto____2876
  }else {
    var or__3693__auto____2877 = p["_"];
    if(cljs.core.truth_(or__3693__auto____2877)) {
      return or__3693__auto____2877
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__2941 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2878 = this$;
      if(cljs.core.truth_(and__3691__auto____2878)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2878
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3693__auto____2879 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2879)) {
          return or__3693__auto____2879
        }else {
          var or__3693__auto____2880 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2880)) {
            return or__3693__auto____2880
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2942 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2881 = this$;
      if(cljs.core.truth_(and__3691__auto____2881)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2881
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3693__auto____2882 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2882)) {
          return or__3693__auto____2882
        }else {
          var or__3693__auto____2883 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2883)) {
            return or__3693__auto____2883
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__2943 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2884 = this$;
      if(cljs.core.truth_(and__3691__auto____2884)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2884
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3693__auto____2885 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2885)) {
          return or__3693__auto____2885
        }else {
          var or__3693__auto____2886 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2886)) {
            return or__3693__auto____2886
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__2944 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2887 = this$;
      if(cljs.core.truth_(and__3691__auto____2887)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2887
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3693__auto____2888 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2888)) {
          return or__3693__auto____2888
        }else {
          var or__3693__auto____2889 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2889)) {
            return or__3693__auto____2889
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__2945 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2890 = this$;
      if(cljs.core.truth_(and__3691__auto____2890)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2890
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3693__auto____2891 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2891)) {
          return or__3693__auto____2891
        }else {
          var or__3693__auto____2892 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2892)) {
            return or__3693__auto____2892
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__2946 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2893 = this$;
      if(cljs.core.truth_(and__3691__auto____2893)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2893
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3693__auto____2894 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2894)) {
          return or__3693__auto____2894
        }else {
          var or__3693__auto____2895 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2895)) {
            return or__3693__auto____2895
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__2947 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2896 = this$;
      if(cljs.core.truth_(and__3691__auto____2896)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2896
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3693__auto____2897 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2897)) {
          return or__3693__auto____2897
        }else {
          var or__3693__auto____2898 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2898)) {
            return or__3693__auto____2898
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__2948 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2899 = this$;
      if(cljs.core.truth_(and__3691__auto____2899)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2899
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3693__auto____2900 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2900)) {
          return or__3693__auto____2900
        }else {
          var or__3693__auto____2901 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2901)) {
            return or__3693__auto____2901
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__2949 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2902 = this$;
      if(cljs.core.truth_(and__3691__auto____2902)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2902
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3693__auto____2903 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2903)) {
          return or__3693__auto____2903
        }else {
          var or__3693__auto____2904 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2904)) {
            return or__3693__auto____2904
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__2950 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2905 = this$;
      if(cljs.core.truth_(and__3691__auto____2905)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2905
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3693__auto____2906 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2906)) {
          return or__3693__auto____2906
        }else {
          var or__3693__auto____2907 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2907)) {
            return or__3693__auto____2907
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__2951 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2908 = this$;
      if(cljs.core.truth_(and__3691__auto____2908)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2908
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3693__auto____2909 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2909)) {
          return or__3693__auto____2909
        }else {
          var or__3693__auto____2910 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2910)) {
            return or__3693__auto____2910
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__2952 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2911 = this$;
      if(cljs.core.truth_(and__3691__auto____2911)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2911
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3693__auto____2912 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2912)) {
          return or__3693__auto____2912
        }else {
          var or__3693__auto____2913 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2913)) {
            return or__3693__auto____2913
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__2953 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2914 = this$;
      if(cljs.core.truth_(and__3691__auto____2914)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2914
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3693__auto____2915 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2915)) {
          return or__3693__auto____2915
        }else {
          var or__3693__auto____2916 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2916)) {
            return or__3693__auto____2916
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__2954 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2917 = this$;
      if(cljs.core.truth_(and__3691__auto____2917)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2917
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3693__auto____2918 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2918)) {
          return or__3693__auto____2918
        }else {
          var or__3693__auto____2919 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2919)) {
            return or__3693__auto____2919
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__2955 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2920 = this$;
      if(cljs.core.truth_(and__3691__auto____2920)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2920
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3693__auto____2921 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2921)) {
          return or__3693__auto____2921
        }else {
          var or__3693__auto____2922 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2922)) {
            return or__3693__auto____2922
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__2956 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2923 = this$;
      if(cljs.core.truth_(and__3691__auto____2923)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2923
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3693__auto____2924 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2924)) {
          return or__3693__auto____2924
        }else {
          var or__3693__auto____2925 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2925)) {
            return or__3693__auto____2925
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__2957 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2926 = this$;
      if(cljs.core.truth_(and__3691__auto____2926)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2926
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3693__auto____2927 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2927)) {
          return or__3693__auto____2927
        }else {
          var or__3693__auto____2928 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2928)) {
            return or__3693__auto____2928
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__2958 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2929 = this$;
      if(cljs.core.truth_(and__3691__auto____2929)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2929
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3693__auto____2930 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2930)) {
          return or__3693__auto____2930
        }else {
          var or__3693__auto____2931 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2931)) {
            return or__3693__auto____2931
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__2959 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2932 = this$;
      if(cljs.core.truth_(and__3691__auto____2932)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2932
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3693__auto____2933 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2933)) {
          return or__3693__auto____2933
        }else {
          var or__3693__auto____2934 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2934)) {
            return or__3693__auto____2934
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__2960 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2935 = this$;
      if(cljs.core.truth_(and__3691__auto____2935)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2935
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3693__auto____2936 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2936)) {
          return or__3693__auto____2936
        }else {
          var or__3693__auto____2937 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2937)) {
            return or__3693__auto____2937
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__2961 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2938 = this$;
      if(cljs.core.truth_(and__3691__auto____2938)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3691__auto____2938
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3693__auto____2939 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3693__auto____2939)) {
          return or__3693__auto____2939
        }else {
          var or__3693__auto____2940 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3693__auto____2940)) {
            return or__3693__auto____2940
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__2941.call(this, this$);
      case 2:
        return _invoke__2942.call(this, this$, a);
      case 3:
        return _invoke__2943.call(this, this$, a, b);
      case 4:
        return _invoke__2944.call(this, this$, a, b, c);
      case 5:
        return _invoke__2945.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__2946.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__2947.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__2948.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__2949.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__2950.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__2951.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__2952.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__2953.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__2954.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__2955.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__2956.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__2957.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__2958.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__2959.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__2960.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__2961.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2963 = coll;
    if(cljs.core.truth_(and__3691__auto____2963)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3691__auto____2963
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3693__auto____2964 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____2964)) {
        return or__3693__auto____2964
      }else {
        var or__3693__auto____2965 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3693__auto____2965)) {
          return or__3693__auto____2965
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2966 = coll;
    if(cljs.core.truth_(and__3691__auto____2966)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3691__auto____2966
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3693__auto____2967 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____2967)) {
        return or__3693__auto____2967
      }else {
        var or__3693__auto____2968 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3693__auto____2968)) {
          return or__3693__auto____2968
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2969 = coll;
    if(cljs.core.truth_(and__3691__auto____2969)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3691__auto____2969
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3693__auto____2970 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____2970)) {
        return or__3693__auto____2970
      }else {
        var or__3693__auto____2971 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3693__auto____2971)) {
          return or__3693__auto____2971
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2978 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2972 = coll;
      if(cljs.core.truth_(and__3691__auto____2972)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3691__auto____2972
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3693__auto____2973 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3693__auto____2973)) {
          return or__3693__auto____2973
        }else {
          var or__3693__auto____2974 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3693__auto____2974)) {
            return or__3693__auto____2974
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__2979 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2975 = coll;
      if(cljs.core.truth_(and__3691__auto____2975)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3691__auto____2975
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3693__auto____2976 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3693__auto____2976)) {
          return or__3693__auto____2976
        }else {
          var or__3693__auto____2977 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3693__auto____2977)) {
            return or__3693__auto____2977
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2978.call(this, coll, n);
      case 3:
        return _nth__2979.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2981 = coll;
    if(cljs.core.truth_(and__3691__auto____2981)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3691__auto____2981
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3693__auto____2982 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____2982)) {
        return or__3693__auto____2982
      }else {
        var or__3693__auto____2983 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3693__auto____2983)) {
          return or__3693__auto____2983
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2984 = coll;
    if(cljs.core.truth_(and__3691__auto____2984)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3691__auto____2984
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3693__auto____2985 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____2985)) {
        return or__3693__auto____2985
      }else {
        var or__3693__auto____2986 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3693__auto____2986)) {
          return or__3693__auto____2986
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2993 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2987 = o;
      if(cljs.core.truth_(and__3691__auto____2987)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3691__auto____2987
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3693__auto____2988 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3693__auto____2988)) {
          return or__3693__auto____2988
        }else {
          var or__3693__auto____2989 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3693__auto____2989)) {
            return or__3693__auto____2989
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__2994 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____2990 = o;
      if(cljs.core.truth_(and__3691__auto____2990)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3691__auto____2990
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3693__auto____2991 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3693__auto____2991)) {
          return or__3693__auto____2991
        }else {
          var or__3693__auto____2992 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3693__auto____2992)) {
            return or__3693__auto____2992
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2993.call(this, o, k);
      case 3:
        return _lookup__2994.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2996 = coll;
    if(cljs.core.truth_(and__3691__auto____2996)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3691__auto____2996
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3693__auto____2997 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____2997)) {
        return or__3693__auto____2997
      }else {
        var or__3693__auto____2998 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3693__auto____2998)) {
          return or__3693__auto____2998
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____2999 = coll;
    if(cljs.core.truth_(and__3691__auto____2999)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3691__auto____2999
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3693__auto____3000 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____3000)) {
        return or__3693__auto____3000
      }else {
        var or__3693__auto____3001 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3693__auto____3001)) {
          return or__3693__auto____3001
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3002 = coll;
    if(cljs.core.truth_(and__3691__auto____3002)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3691__auto____3002
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3693__auto____3003 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____3003)) {
        return or__3693__auto____3003
      }else {
        var or__3693__auto____3004 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3693__auto____3004)) {
          return or__3693__auto____3004
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3005 = coll;
    if(cljs.core.truth_(and__3691__auto____3005)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3691__auto____3005
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3693__auto____3006 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____3006)) {
        return or__3693__auto____3006
      }else {
        var or__3693__auto____3007 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3693__auto____3007)) {
          return or__3693__auto____3007
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3008 = coll;
    if(cljs.core.truth_(and__3691__auto____3008)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3691__auto____3008
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3693__auto____3009 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____3009)) {
        return or__3693__auto____3009
      }else {
        var or__3693__auto____3010 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3693__auto____3010)) {
          return or__3693__auto____3010
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3011 = coll;
    if(cljs.core.truth_(and__3691__auto____3011)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3691__auto____3011
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3693__auto____3012 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____3012)) {
        return or__3693__auto____3012
      }else {
        var or__3693__auto____3013 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3693__auto____3013)) {
          return or__3693__auto____3013
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3014 = coll;
    if(cljs.core.truth_(and__3691__auto____3014)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3691__auto____3014
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3693__auto____3015 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3693__auto____3015)) {
        return or__3693__auto____3015
      }else {
        var or__3693__auto____3016 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3693__auto____3016)) {
          return or__3693__auto____3016
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3017 = o;
    if(cljs.core.truth_(and__3691__auto____3017)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3691__auto____3017
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3693__auto____3018 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3018)) {
        return or__3693__auto____3018
      }else {
        var or__3693__auto____3019 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3693__auto____3019)) {
          return or__3693__auto____3019
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3020 = o;
    if(cljs.core.truth_(and__3691__auto____3020)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3691__auto____3020
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3693__auto____3021 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3021)) {
        return or__3693__auto____3021
      }else {
        var or__3693__auto____3022 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3693__auto____3022)) {
          return or__3693__auto____3022
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3023 = o;
    if(cljs.core.truth_(and__3691__auto____3023)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3691__auto____3023
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3693__auto____3024 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3024)) {
        return or__3693__auto____3024
      }else {
        var or__3693__auto____3025 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3693__auto____3025)) {
          return or__3693__auto____3025
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3026 = o;
    if(cljs.core.truth_(and__3691__auto____3026)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3691__auto____3026
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3693__auto____3027 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3027)) {
        return or__3693__auto____3027
      }else {
        var or__3693__auto____3028 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3693__auto____3028)) {
          return or__3693__auto____3028
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__3035 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____3029 = coll;
      if(cljs.core.truth_(and__3691__auto____3029)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3691__auto____3029
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3693__auto____3030 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3693__auto____3030)) {
          return or__3693__auto____3030
        }else {
          var or__3693__auto____3031 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3693__auto____3031)) {
            return or__3693__auto____3031
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3036 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____3032 = coll;
      if(cljs.core.truth_(and__3691__auto____3032)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3691__auto____3032
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3693__auto____3033 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3693__auto____3033)) {
          return or__3693__auto____3033
        }else {
          var or__3693__auto____3034 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3693__auto____3034)) {
            return or__3693__auto____3034
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__3035.call(this, coll, f);
      case 3:
        return _reduce__3036.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3038 = o;
    if(cljs.core.truth_(and__3691__auto____3038)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3691__auto____3038
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3693__auto____3039 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3039)) {
        return or__3693__auto____3039
      }else {
        var or__3693__auto____3040 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3693__auto____3040)) {
          return or__3693__auto____3040
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3041 = o;
    if(cljs.core.truth_(and__3691__auto____3041)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3691__auto____3041
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3693__auto____3042 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3042)) {
        return or__3693__auto____3042
      }else {
        var or__3693__auto____3043 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3693__auto____3043)) {
          return or__3693__auto____3043
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3044 = o;
    if(cljs.core.truth_(and__3691__auto____3044)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3691__auto____3044
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3693__auto____3045 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3045)) {
        return or__3693__auto____3045
      }else {
        var or__3693__auto____3046 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3693__auto____3046)) {
          return or__3693__auto____3046
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3047 = o;
    if(cljs.core.truth_(and__3691__auto____3047)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3691__auto____3047
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3693__auto____3048 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3693__auto____3048)) {
        return or__3693__auto____3048
      }else {
        var or__3693__auto____3049 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3693__auto____3049)) {
          return or__3693__auto____3049
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3050 = d;
    if(cljs.core.truth_(and__3691__auto____3050)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3691__auto____3050
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3693__auto____3051 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3693__auto____3051)) {
        return or__3693__auto____3051
      }else {
        var or__3693__auto____3052 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3693__auto____3052)) {
          return or__3693__auto____3052
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3053 = this$;
    if(cljs.core.truth_(and__3691__auto____3053)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3691__auto____3053
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3693__auto____3054 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3693__auto____3054)) {
        return or__3693__auto____3054
      }else {
        var or__3693__auto____3055 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3693__auto____3055)) {
          return or__3693__auto____3055
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3056 = this$;
    if(cljs.core.truth_(and__3691__auto____3056)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3691__auto____3056
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3693__auto____3057 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3693__auto____3057)) {
        return or__3693__auto____3057
      }else {
        var or__3693__auto____3058 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3693__auto____3058)) {
          return or__3693__auto____3058
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3059 = this$;
    if(cljs.core.truth_(and__3691__auto____3059)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3691__auto____3059
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3693__auto____3060 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3693__auto____3060)) {
        return or__3693__auto____3060
      }else {
        var or__3693__auto____3061 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3693__auto____3061)) {
          return or__3693__auto____3061
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
Function.prototype.cljs$core$IPrintable$ = true;
Function.prototype.cljs$core$IPrintable$_pr_seq = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__3062 = null;
  var G__3062__3063 = function(o, k) {
    return null
  };
  var G__3062__3064 = function(o, k, not_found) {
    return not_found
  };
  G__3062 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3062__3063.call(this, o, k);
      case 3:
        return G__3062__3064.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3062
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__3066 = null;
  var G__3066__3067 = function(_, f) {
    return f.call(null)
  };
  var G__3066__3068 = function(_, f, start) {
    return start
  };
  G__3066 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3066__3067.call(this, _, f);
      case 3:
        return G__3066__3068.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3066
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return cljs.core.nil_QMARK_.call(null, o)
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__3070 = null;
  var G__3070__3071 = function(_, n) {
    return null
  };
  var G__3070__3072 = function(_, n, not_found) {
    return not_found
  };
  G__3070 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3070__3071.call(this, _, n);
      case 3:
        return G__3070__3072.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3070
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__3080 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__3074 = cljs.core._nth.call(null, cicoll, 0);
      var n__3075 = 1;
      while(true) {
        if(cljs.core.truth_(n__3075 < cljs.core._count.call(null, cicoll))) {
          var G__3084 = f.call(null, val__3074, cljs.core._nth.call(null, cicoll, n__3075));
          var G__3085 = n__3075 + 1;
          val__3074 = G__3084;
          n__3075 = G__3085;
          continue
        }else {
          return val__3074
        }
        break
      }
    }
  };
  var ci_reduce__3081 = function(cicoll, f, val) {
    var val__3076 = val;
    var n__3077 = 0;
    while(true) {
      if(cljs.core.truth_(n__3077 < cljs.core._count.call(null, cicoll))) {
        var G__3086 = f.call(null, val__3076, cljs.core._nth.call(null, cicoll, n__3077));
        var G__3087 = n__3077 + 1;
        val__3076 = G__3086;
        n__3077 = G__3087;
        continue
      }else {
        return val__3076
      }
      break
    }
  };
  var ci_reduce__3082 = function(cicoll, f, val, idx) {
    var val__3078 = val;
    var n__3079 = idx;
    while(true) {
      if(cljs.core.truth_(n__3079 < cljs.core._count.call(null, cicoll))) {
        var G__3088 = f.call(null, val__3078, cljs.core._nth.call(null, cicoll, n__3079));
        var G__3089 = n__3079 + 1;
        val__3078 = G__3088;
        n__3079 = G__3089;
        continue
      }else {
        return val__3078
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__3080.call(this, cicoll, f);
      case 3:
        return ci_reduce__3081.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__3082.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3090 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3103 = null;
  var G__3103__3104 = function(_, f) {
    var this__3091 = this;
    return cljs.core.ci_reduce.call(null, this__3091.a, f, this__3091.a[this__3091.i], this__3091.i + 1)
  };
  var G__3103__3105 = function(_, f, start) {
    var this__3092 = this;
    return cljs.core.ci_reduce.call(null, this__3092.a, f, start, this__3092.i)
  };
  G__3103 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3103__3104.call(this, _, f);
      case 3:
        return G__3103__3105.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3103
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3093 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3094 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3107 = null;
  var G__3107__3108 = function(coll, n) {
    var this__3095 = this;
    var i__3096 = n + this__3095.i;
    if(cljs.core.truth_(i__3096 < this__3095.a.length)) {
      return this__3095.a[i__3096]
    }else {
      return null
    }
  };
  var G__3107__3109 = function(coll, n, not_found) {
    var this__3097 = this;
    var i__3098 = n + this__3097.i;
    if(cljs.core.truth_(i__3098 < this__3097.a.length)) {
      return this__3097.a[i__3098]
    }else {
      return not_found
    }
  };
  G__3107 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3107__3108.call(this, coll, n);
      case 3:
        return G__3107__3109.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3107
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__3099 = this;
  return this__3099.a.length - this__3099.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__3100 = this;
  return this__3100.a[this__3100.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__3101 = this;
  if(cljs.core.truth_(this__3101.i + 1 < this__3101.a.length)) {
    return new cljs.core.IndexedSeq(this__3101.a, this__3101.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__3102 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3111 = null;
  var G__3111__3112 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3111__3113 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3111 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3111__3112.call(this, array, f);
      case 3:
        return G__3111__3113.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3111
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3115 = null;
  var G__3115__3116 = function(array, k) {
    return array[k]
  };
  var G__3115__3117 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3115 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3115__3116.call(this, array, k);
      case 3:
        return G__3115__3117.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3115
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3119 = null;
  var G__3119__3120 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3119__3121 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3119 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3119__3120.call(this, array, n);
      case 3:
        return G__3119__3121.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3119
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3843__auto____3123 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3843__auto____3123)) {
    var s__3124 = temp__3843__auto____3123;
    return cljs.core._first.call(null, s__3124)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__3125 = cljs.core.next.call(null, s);
      s = G__3125;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__3126 = cljs.core.seq.call(null, x);
  var n__3127 = 0;
  while(true) {
    if(cljs.core.truth_(s__3126)) {
      var G__3128 = cljs.core.next.call(null, s__3126);
      var G__3129 = n__3127 + 1;
      s__3126 = G__3128;
      n__3127 = G__3129;
      continue
    }else {
      return n__3127
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__3130 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3131 = function() {
    var G__3133__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3134 = conj.call(null, coll, x);
          var G__3135 = cljs.core.first.call(null, xs);
          var G__3136 = cljs.core.next.call(null, xs);
          coll = G__3134;
          x = G__3135;
          xs = G__3136;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3133 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3133__delegate.call(this, coll, x, xs)
    };
    G__3133.cljs$lang$maxFixedArity = 2;
    G__3133.cljs$lang$applyTo = function(arglist__3137) {
      var coll = cljs.core.first(arglist__3137);
      var x = cljs.core.first(cljs.core.next(arglist__3137));
      var xs = cljs.core.rest(cljs.core.next(arglist__3137));
      return G__3133__delegate.call(this, coll, x, xs)
    };
    return G__3133
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__3130.call(this, coll, x);
      default:
        return conj__3131.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3131.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__3138 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3139 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__3138.call(this, coll, n);
      case 3:
        return nth__3139.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__3141 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3142 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__3141.call(this, o, k);
      case 3:
        return get__3142.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3145 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__3146 = function() {
    var G__3148__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__3144 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3149 = ret__3144;
          var G__3150 = cljs.core.first.call(null, kvs);
          var G__3151 = cljs.core.second.call(null, kvs);
          var G__3152 = cljs.core.nnext.call(null, kvs);
          coll = G__3149;
          k = G__3150;
          v = G__3151;
          kvs = G__3152;
          continue
        }else {
          return ret__3144
        }
        break
      }
    };
    var G__3148 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3148__delegate.call(this, coll, k, v, kvs)
    };
    G__3148.cljs$lang$maxFixedArity = 3;
    G__3148.cljs$lang$applyTo = function(arglist__3153) {
      var coll = cljs.core.first(arglist__3153);
      var k = cljs.core.first(cljs.core.next(arglist__3153));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3153)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3153)));
      return G__3148__delegate.call(this, coll, k, v, kvs)
    };
    return G__3148
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3145.call(this, coll, k, v);
      default:
        return assoc__3146.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__3146.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__3155 = function(coll) {
    return coll
  };
  var dissoc__3156 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3157 = function() {
    var G__3159__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3154 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3160 = ret__3154;
          var G__3161 = cljs.core.first.call(null, ks);
          var G__3162 = cljs.core.next.call(null, ks);
          coll = G__3160;
          k = G__3161;
          ks = G__3162;
          continue
        }else {
          return ret__3154
        }
        break
      }
    };
    var G__3159 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3159__delegate.call(this, coll, k, ks)
    };
    G__3159.cljs$lang$maxFixedArity = 2;
    G__3159.cljs$lang$applyTo = function(arglist__3163) {
      var coll = cljs.core.first(arglist__3163);
      var k = cljs.core.first(cljs.core.next(arglist__3163));
      var ks = cljs.core.rest(cljs.core.next(arglist__3163));
      return G__3159__delegate.call(this, coll, k, ks)
    };
    return G__3159
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__3155.call(this, coll);
      case 2:
        return dissoc__3156.call(this, coll, k);
      default:
        return dissoc__3157.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3157.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__418__auto____3164 = o;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3165 = x__418__auto____3164;
      if(cljs.core.truth_(and__3691__auto____3165)) {
        var and__3691__auto____3166 = x__418__auto____3164.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3691__auto____3166)) {
          return cljs.core.not.call(null, x__418__auto____3164.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3691__auto____3166
        }
      }else {
        return and__3691__auto____3165
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__418__auto____3164)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__3168 = function(coll) {
    return coll
  };
  var disj__3169 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3170 = function() {
    var G__3172__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3167 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3173 = ret__3167;
          var G__3174 = cljs.core.first.call(null, ks);
          var G__3175 = cljs.core.next.call(null, ks);
          coll = G__3173;
          k = G__3174;
          ks = G__3175;
          continue
        }else {
          return ret__3167
        }
        break
      }
    };
    var G__3172 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3172__delegate.call(this, coll, k, ks)
    };
    G__3172.cljs$lang$maxFixedArity = 2;
    G__3172.cljs$lang$applyTo = function(arglist__3176) {
      var coll = cljs.core.first(arglist__3176);
      var k = cljs.core.first(cljs.core.next(arglist__3176));
      var ks = cljs.core.rest(cljs.core.next(arglist__3176));
      return G__3172__delegate.call(this, coll, k, ks)
    };
    return G__3172
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__3168.call(this, coll);
      case 2:
        return disj__3169.call(this, coll, k);
      default:
        return disj__3170.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3170.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
    return false
  }else {
    var x__418__auto____3177 = x;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3178 = x__418__auto____3177;
      if(cljs.core.truth_(and__3691__auto____3178)) {
        var and__3691__auto____3179 = x__418__auto____3177.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3691__auto____3179)) {
          return cljs.core.not.call(null, x__418__auto____3177.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3691__auto____3179
        }
      }else {
        return and__3691__auto____3178
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__418__auto____3177)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
    return false
  }else {
    var x__418__auto____3180 = x;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3181 = x__418__auto____3180;
      if(cljs.core.truth_(and__3691__auto____3181)) {
        var and__3691__auto____3182 = x__418__auto____3180.cljs$core$ISet$;
        if(cljs.core.truth_(and__3691__auto____3182)) {
          return cljs.core.not.call(null, x__418__auto____3180.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3691__auto____3182
        }
      }else {
        return and__3691__auto____3181
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__418__auto____3180)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__418__auto____3183 = x;
  if(cljs.core.truth_(function() {
    var and__3691__auto____3184 = x__418__auto____3183;
    if(cljs.core.truth_(and__3691__auto____3184)) {
      var and__3691__auto____3185 = x__418__auto____3183.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3691__auto____3185)) {
        return cljs.core.not.call(null, x__418__auto____3183.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3691__auto____3185
      }
    }else {
      return and__3691__auto____3184
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__418__auto____3183)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__418__auto____3186 = x;
  if(cljs.core.truth_(function() {
    var and__3691__auto____3187 = x__418__auto____3186;
    if(cljs.core.truth_(and__3691__auto____3187)) {
      var and__3691__auto____3188 = x__418__auto____3186.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3691__auto____3188)) {
        return cljs.core.not.call(null, x__418__auto____3186.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3691__auto____3188
      }
    }else {
      return and__3691__auto____3187
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__418__auto____3186)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__418__auto____3189 = x;
  if(cljs.core.truth_(function() {
    var and__3691__auto____3190 = x__418__auto____3189;
    if(cljs.core.truth_(and__3691__auto____3190)) {
      var and__3691__auto____3191 = x__418__auto____3189.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3691__auto____3191)) {
        return cljs.core.not.call(null, x__418__auto____3189.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3691__auto____3191
      }
    }else {
      return and__3691__auto____3190
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__418__auto____3189)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
    return false
  }else {
    var x__418__auto____3192 = x;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3193 = x__418__auto____3192;
      if(cljs.core.truth_(and__3691__auto____3193)) {
        var and__3691__auto____3194 = x__418__auto____3192.cljs$core$IMap$;
        if(cljs.core.truth_(and__3691__auto____3194)) {
          return cljs.core.not.call(null, x__418__auto____3192.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3691__auto____3194
        }
      }else {
        return and__3691__auto____3193
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__418__auto____3192)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__418__auto____3195 = x;
  if(cljs.core.truth_(function() {
    var and__3691__auto____3196 = x__418__auto____3195;
    if(cljs.core.truth_(and__3691__auto____3196)) {
      var and__3691__auto____3197 = x__418__auto____3195.cljs$core$IVector$;
      if(cljs.core.truth_(and__3691__auto____3197)) {
        return cljs.core.not.call(null, x__418__auto____3195.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3691__auto____3197
      }
    }else {
      return and__3691__auto____3196
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__418__auto____3195)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__3198 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__3198.push(key)
  });
  return keys__3198
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, s))) {
    return false
  }else {
    var x__418__auto____3199 = s;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3200 = x__418__auto____3199;
      if(cljs.core.truth_(and__3691__auto____3200)) {
        var and__3691__auto____3201 = x__418__auto____3199.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3691__auto____3201)) {
          return cljs.core.not.call(null, x__418__auto____3199.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3691__auto____3201
        }
      }else {
        return and__3691__auto____3200
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__418__auto____3199)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3691__auto____3202 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3691__auto____3202)) {
    return cljs.core.not.call(null, function() {
      var or__3693__auto____3203 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3693__auto____3203)) {
        return or__3693__auto____3203
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3691__auto____3202
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3691__auto____3204 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3691__auto____3204)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3691__auto____3204
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3691__auto____3205 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3691__auto____3205)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3691__auto____3205
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3691__auto____3206 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3691__auto____3206)) {
    return n == n.toFixed()
  }else {
    return and__3691__auto____3206
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____3207 = coll;
    if(cljs.core.truth_(and__3691__auto____3207)) {
      var and__3691__auto____3208 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3691__auto____3208)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3691__auto____3208
      }
    }else {
      return and__3691__auto____3207
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___3213 = function(x) {
    return true
  };
  var distinct_QMARK___3214 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3215 = function() {
    var G__3217__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__3209 = cljs.core.set([y, x]);
        var xs__3210 = more;
        while(true) {
          var x__3211 = cljs.core.first.call(null, xs__3210);
          var etc__3212 = cljs.core.next.call(null, xs__3210);
          if(cljs.core.truth_(xs__3210)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__3209, x__3211))) {
              return false
            }else {
              var G__3218 = cljs.core.conj.call(null, s__3209, x__3211);
              var G__3219 = etc__3212;
              s__3209 = G__3218;
              xs__3210 = G__3219;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3217 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3217__delegate.call(this, x, y, more)
    };
    G__3217.cljs$lang$maxFixedArity = 2;
    G__3217.cljs$lang$applyTo = function(arglist__3220) {
      var x = cljs.core.first(arglist__3220);
      var y = cljs.core.first(cljs.core.next(arglist__3220));
      var more = cljs.core.rest(cljs.core.next(arglist__3220));
      return G__3217__delegate.call(this, x, y, more)
    };
    return G__3217
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___3213.call(this, x);
      case 2:
        return distinct_QMARK___3214.call(this, x, y);
      default:
        return distinct_QMARK___3215.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3215.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__3221 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__3221))) {
        return r__3221
      }else {
        if(cljs.core.truth_(r__3221)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__3223 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__3224 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__3222 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__3222, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__3222)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__3223.call(this, comp);
      case 2:
        return sort__3224.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__3226 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3227 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__3226.call(this, keyfn, comp);
      case 3:
        return sort_by__3227.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__3229 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3230 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__3229.call(this, f, val);
      case 3:
        return reduce__3230.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__3236 = function(f, coll) {
    var temp__3840__auto____3232 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3840__auto____3232)) {
      var s__3233 = temp__3840__auto____3232;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__3233), cljs.core.next.call(null, s__3233))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3237 = function(f, val, coll) {
    var val__3234 = val;
    var coll__3235 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__3235)) {
        var G__3239 = f.call(null, val__3234, cljs.core.first.call(null, coll__3235));
        var G__3240 = cljs.core.next.call(null, coll__3235);
        val__3234 = G__3239;
        coll__3235 = G__3240;
        continue
      }else {
        return val__3234
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__3236.call(this, f, val);
      case 3:
        return seq_reduce__3237.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__3241 = null;
  var G__3241__3242 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__3241__3243 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__3241 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3241__3242.call(this, coll, f);
      case 3:
        return G__3241__3243.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3241
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___3245 = function() {
    return 0
  };
  var _PLUS___3246 = function(x) {
    return x
  };
  var _PLUS___3247 = function(x, y) {
    return x + y
  };
  var _PLUS___3248 = function() {
    var G__3250__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__3250 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3250__delegate.call(this, x, y, more)
    };
    G__3250.cljs$lang$maxFixedArity = 2;
    G__3250.cljs$lang$applyTo = function(arglist__3251) {
      var x = cljs.core.first(arglist__3251);
      var y = cljs.core.first(cljs.core.next(arglist__3251));
      var more = cljs.core.rest(cljs.core.next(arglist__3251));
      return G__3250__delegate.call(this, x, y, more)
    };
    return G__3250
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___3245.call(this);
      case 1:
        return _PLUS___3246.call(this, x);
      case 2:
        return _PLUS___3247.call(this, x, y);
      default:
        return _PLUS___3248.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3248.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___3252 = function(x) {
    return-x
  };
  var ___3253 = function(x, y) {
    return x - y
  };
  var ___3254 = function() {
    var G__3256__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__3256 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3256__delegate.call(this, x, y, more)
    };
    G__3256.cljs$lang$maxFixedArity = 2;
    G__3256.cljs$lang$applyTo = function(arglist__3257) {
      var x = cljs.core.first(arglist__3257);
      var y = cljs.core.first(cljs.core.next(arglist__3257));
      var more = cljs.core.rest(cljs.core.next(arglist__3257));
      return G__3256__delegate.call(this, x, y, more)
    };
    return G__3256
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___3252.call(this, x);
      case 2:
        return ___3253.call(this, x, y);
      default:
        return ___3254.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3254.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___3258 = function() {
    return 1
  };
  var _STAR___3259 = function(x) {
    return x
  };
  var _STAR___3260 = function(x, y) {
    return x * y
  };
  var _STAR___3261 = function() {
    var G__3263__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__3263 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3263__delegate.call(this, x, y, more)
    };
    G__3263.cljs$lang$maxFixedArity = 2;
    G__3263.cljs$lang$applyTo = function(arglist__3264) {
      var x = cljs.core.first(arglist__3264);
      var y = cljs.core.first(cljs.core.next(arglist__3264));
      var more = cljs.core.rest(cljs.core.next(arglist__3264));
      return G__3263__delegate.call(this, x, y, more)
    };
    return G__3263
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___3258.call(this);
      case 1:
        return _STAR___3259.call(this, x);
      case 2:
        return _STAR___3260.call(this, x, y);
      default:
        return _STAR___3261.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3261.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___3265 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___3266 = function(x, y) {
    return _SLASH_.call(null, x, y)
  };
  var _SLASH___3267 = function() {
    var G__3269__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3269 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3269__delegate.call(this, x, y, more)
    };
    G__3269.cljs$lang$maxFixedArity = 2;
    G__3269.cljs$lang$applyTo = function(arglist__3270) {
      var x = cljs.core.first(arglist__3270);
      var y = cljs.core.first(cljs.core.next(arglist__3270));
      var more = cljs.core.rest(cljs.core.next(arglist__3270));
      return G__3269__delegate.call(this, x, y, more)
    };
    return G__3269
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___3265.call(this, x);
      case 2:
        return _SLASH___3266.call(this, x, y);
      default:
        return _SLASH___3267.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3267.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___3271 = function(x) {
    return true
  };
  var _LT___3272 = function(x, y) {
    return x < y
  };
  var _LT___3273 = function() {
    var G__3275__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3276 = y;
            var G__3277 = cljs.core.first.call(null, more);
            var G__3278 = cljs.core.next.call(null, more);
            x = G__3276;
            y = G__3277;
            more = G__3278;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3275 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3275__delegate.call(this, x, y, more)
    };
    G__3275.cljs$lang$maxFixedArity = 2;
    G__3275.cljs$lang$applyTo = function(arglist__3279) {
      var x = cljs.core.first(arglist__3279);
      var y = cljs.core.first(cljs.core.next(arglist__3279));
      var more = cljs.core.rest(cljs.core.next(arglist__3279));
      return G__3275__delegate.call(this, x, y, more)
    };
    return G__3275
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___3271.call(this, x);
      case 2:
        return _LT___3272.call(this, x, y);
      default:
        return _LT___3273.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3273.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___3280 = function(x) {
    return true
  };
  var _LT__EQ___3281 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3282 = function() {
    var G__3284__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3285 = y;
            var G__3286 = cljs.core.first.call(null, more);
            var G__3287 = cljs.core.next.call(null, more);
            x = G__3285;
            y = G__3286;
            more = G__3287;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3284 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3284__delegate.call(this, x, y, more)
    };
    G__3284.cljs$lang$maxFixedArity = 2;
    G__3284.cljs$lang$applyTo = function(arglist__3288) {
      var x = cljs.core.first(arglist__3288);
      var y = cljs.core.first(cljs.core.next(arglist__3288));
      var more = cljs.core.rest(cljs.core.next(arglist__3288));
      return G__3284__delegate.call(this, x, y, more)
    };
    return G__3284
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___3280.call(this, x);
      case 2:
        return _LT__EQ___3281.call(this, x, y);
      default:
        return _LT__EQ___3282.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3282.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___3289 = function(x) {
    return true
  };
  var _GT___3290 = function(x, y) {
    return x > y
  };
  var _GT___3291 = function() {
    var G__3293__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3294 = y;
            var G__3295 = cljs.core.first.call(null, more);
            var G__3296 = cljs.core.next.call(null, more);
            x = G__3294;
            y = G__3295;
            more = G__3296;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3293 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3293__delegate.call(this, x, y, more)
    };
    G__3293.cljs$lang$maxFixedArity = 2;
    G__3293.cljs$lang$applyTo = function(arglist__3297) {
      var x = cljs.core.first(arglist__3297);
      var y = cljs.core.first(cljs.core.next(arglist__3297));
      var more = cljs.core.rest(cljs.core.next(arglist__3297));
      return G__3293__delegate.call(this, x, y, more)
    };
    return G__3293
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___3289.call(this, x);
      case 2:
        return _GT___3290.call(this, x, y);
      default:
        return _GT___3291.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3291.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___3298 = function(x) {
    return true
  };
  var _GT__EQ___3299 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3300 = function() {
    var G__3302__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3303 = y;
            var G__3304 = cljs.core.first.call(null, more);
            var G__3305 = cljs.core.next.call(null, more);
            x = G__3303;
            y = G__3304;
            more = G__3305;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3302 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3302__delegate.call(this, x, y, more)
    };
    G__3302.cljs$lang$maxFixedArity = 2;
    G__3302.cljs$lang$applyTo = function(arglist__3306) {
      var x = cljs.core.first(arglist__3306);
      var y = cljs.core.first(cljs.core.next(arglist__3306));
      var more = cljs.core.rest(cljs.core.next(arglist__3306));
      return G__3302__delegate.call(this, x, y, more)
    };
    return G__3302
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___3298.call(this, x);
      case 2:
        return _GT__EQ___3299.call(this, x, y);
      default:
        return _GT__EQ___3300.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3300.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__3307 = function(x) {
    return x
  };
  var max__3308 = function(x, y) {
    return x > y ? x : y
  };
  var max__3309 = function() {
    var G__3311__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__3311 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3311__delegate.call(this, x, y, more)
    };
    G__3311.cljs$lang$maxFixedArity = 2;
    G__3311.cljs$lang$applyTo = function(arglist__3312) {
      var x = cljs.core.first(arglist__3312);
      var y = cljs.core.first(cljs.core.next(arglist__3312));
      var more = cljs.core.rest(cljs.core.next(arglist__3312));
      return G__3311__delegate.call(this, x, y, more)
    };
    return G__3311
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__3307.call(this, x);
      case 2:
        return max__3308.call(this, x, y);
      default:
        return max__3309.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3309.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__3313 = function(x) {
    return x
  };
  var min__3314 = function(x, y) {
    return x < y ? x : y
  };
  var min__3315 = function() {
    var G__3317__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__3317 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3317__delegate.call(this, x, y, more)
    };
    G__3317.cljs$lang$maxFixedArity = 2;
    G__3317.cljs$lang$applyTo = function(arglist__3318) {
      var x = cljs.core.first(arglist__3318);
      var y = cljs.core.first(cljs.core.next(arglist__3318));
      var more = cljs.core.rest(cljs.core.next(arglist__3318));
      return G__3317__delegate.call(this, x, y, more)
    };
    return G__3317
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__3313.call(this, x);
      case 2:
        return min__3314.call(this, x, y);
      default:
        return min__3315.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3315.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__3319 = n % d;
  return cljs.core.fix.call(null, (n - rem__3319) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__3320 = cljs.core.quot.call(null, n, d);
  return n - d * q__3320
};
cljs.core.rand = function() {
  var rand = null;
  var rand__3321 = function() {
    return Math.random.call(null)
  };
  var rand__3322 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__3321.call(this);
      case 1:
        return rand__3322.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___3324 = function(x) {
    return true
  };
  var _EQ__EQ___3325 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3326 = function() {
    var G__3328__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3329 = y;
            var G__3330 = cljs.core.first.call(null, more);
            var G__3331 = cljs.core.next.call(null, more);
            x = G__3329;
            y = G__3330;
            more = G__3331;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3328 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3328__delegate.call(this, x, y, more)
    };
    G__3328.cljs$lang$maxFixedArity = 2;
    G__3328.cljs$lang$applyTo = function(arglist__3332) {
      var x = cljs.core.first(arglist__3332);
      var y = cljs.core.first(cljs.core.next(arglist__3332));
      var more = cljs.core.rest(cljs.core.next(arglist__3332));
      return G__3328__delegate.call(this, x, y, more)
    };
    return G__3328
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___3324.call(this, x);
      case 2:
        return _EQ__EQ___3325.call(this, x, y);
      default:
        return _EQ__EQ___3326.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3326.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__3333 = n;
  var xs__3334 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____3335 = xs__3334;
      if(cljs.core.truth_(and__3691__auto____3335)) {
        return n__3333 > 0
      }else {
        return and__3691__auto____3335
      }
    }())) {
      var G__3336 = n__3333 - 1;
      var G__3337 = cljs.core.next.call(null, xs__3334);
      n__3333 = G__3336;
      xs__3334 = G__3337;
      continue
    }else {
      return xs__3334
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__3342 = null;
  var G__3342__3343 = function(coll, n) {
    var temp__3840__auto____3338 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3840__auto____3338)) {
      var xs__3339 = temp__3840__auto____3338;
      return cljs.core.first.call(null, xs__3339)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__3342__3344 = function(coll, n, not_found) {
    var temp__3840__auto____3340 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3840__auto____3340)) {
      var xs__3341 = temp__3840__auto____3340;
      return cljs.core.first.call(null, xs__3341)
    }else {
      return not_found
    }
  };
  G__3342 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3342__3343.call(this, coll, n);
      case 3:
        return G__3342__3344.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3342
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___3346 = function() {
    return""
  };
  var str_STAR___3347 = function(x) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___3348 = function() {
    var G__3350__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3351 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3352 = cljs.core.next.call(null, more);
            sb = G__3351;
            more = G__3352;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3350 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3350__delegate.call(this, x, ys)
    };
    G__3350.cljs$lang$maxFixedArity = 1;
    G__3350.cljs$lang$applyTo = function(arglist__3353) {
      var x = cljs.core.first(arglist__3353);
      var ys = cljs.core.rest(arglist__3353);
      return G__3350__delegate.call(this, x, ys)
    };
    return G__3350
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___3346.call(this);
      case 1:
        return str_STAR___3347.call(this, x);
      default:
        return str_STAR___3348.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___3348.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__3354 = function() {
    return""
  };
  var str__3355 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x))) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__3356 = function() {
    var G__3358__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__3358 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3358__delegate.call(this, x, ys)
    };
    G__3358.cljs$lang$maxFixedArity = 1;
    G__3358.cljs$lang$applyTo = function(arglist__3359) {
      var x = cljs.core.first(arglist__3359);
      var ys = cljs.core.rest(arglist__3359);
      return G__3358__delegate.call(this, x, ys)
    };
    return G__3358
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__3354.call(this);
      case 1:
        return str__3355.call(this, x);
      default:
        return str__3356.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__3356.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__3360 = function(s, start) {
    return s.substring(start)
  };
  var subs__3361 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__3360.call(this, s, start);
      case 3:
        return subs__3361.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__3363 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__3364 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__3363.call(this, ns);
      case 2:
        return symbol__3364.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__3366 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__3367 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__3366.call(this, ns);
      case 2:
        return keyword__3367.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__3369 = cljs.core.seq.call(null, x);
    var ys__3370 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, xs__3369))) {
        return cljs.core.nil_QMARK_.call(null, ys__3370)
      }else {
        if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, ys__3370))) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__3369), cljs.core.first.call(null, ys__3370)))) {
            var G__3371 = cljs.core.next.call(null, xs__3369);
            var G__3372 = cljs.core.next.call(null, ys__3370);
            xs__3369 = G__3371;
            ys__3370 = G__3372;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3373_SHARP_, p2__3374_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3373_SHARP_, cljs.core.hash.call(null, p2__3374_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3375__3376 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__3375__3376)) {
    var G__3378__3380 = cljs.core.first.call(null, G__3375__3376);
    var vec__3379__3381 = G__3378__3380;
    var key_name__3382 = cljs.core.nth.call(null, vec__3379__3381, 0, null);
    var f__3383 = cljs.core.nth.call(null, vec__3379__3381, 1, null);
    var G__3375__3384 = G__3375__3376;
    var G__3378__3385 = G__3378__3380;
    var G__3375__3386 = G__3375__3384;
    while(true) {
      var vec__3387__3388 = G__3378__3385;
      var key_name__3389 = cljs.core.nth.call(null, vec__3387__3388, 0, null);
      var f__3390 = cljs.core.nth.call(null, vec__3387__3388, 1, null);
      var G__3375__3391 = G__3375__3386;
      var str_name__3392 = cljs.core.name.call(null, key_name__3389);
      obj[str_name__3392] = f__3390;
      var temp__3843__auto____3393 = cljs.core.next.call(null, G__3375__3391);
      if(cljs.core.truth_(temp__3843__auto____3393)) {
        var G__3375__3394 = temp__3843__auto____3393;
        var G__3395 = cljs.core.first.call(null, G__3375__3394);
        var G__3396 = G__3375__3394;
        G__3378__3385 = G__3395;
        G__3375__3386 = G__3396;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3397 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3398 = this;
  return new cljs.core.List(this__3398.meta, o, coll, this__3398.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3399 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3400 = this;
  return this__3400.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3401 = this;
  return this__3401.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3402 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3403 = this;
  return this__3403.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3404 = this;
  return this__3404.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3405 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3406 = this;
  return new cljs.core.List(meta, this__3406.first, this__3406.rest, this__3406.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3407 = this;
  return this__3407.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3408 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3409 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3410 = this;
  return new cljs.core.List(this__3410.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3411 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3412 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3413 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3414 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3415 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3416 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3417 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3418 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3419 = this;
  return this__3419.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3420 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__3421) {
    var items = cljs.core.seq(arglist__3421);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3422 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3423 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3424 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3425 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3425.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3426 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3427 = this;
  return this__3427.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3428 = this;
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, this__3428.rest))) {
    return cljs.core.List.EMPTY
  }else {
    return this__3428.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3429 = this;
  return this__3429.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3430 = this;
  return new cljs.core.Cons(meta, this__3430.first, this__3430.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3431 = null;
  var G__3431__3432 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3431__3433 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3431 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3431__3432.call(this, string, f);
      case 3:
        return G__3431__3433.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3431
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3435 = null;
  var G__3435__3436 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3435__3437 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3435 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3435__3436.call(this, string, k);
      case 3:
        return G__3435__3437.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3435
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3439 = null;
  var G__3439__3440 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3439__3441 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3439 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3439__3440.call(this, string, n);
      case 3:
        return G__3439__3441.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3439
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3443 = null;
  var G__3443__3444 = function(this$, coll) {
    this$ = this;
    return cljs.core.get.call(null, coll, this$.toString())
  };
  var G__3443__3445 = function(this$, coll, not_found) {
    this$ = this;
    return cljs.core.get.call(null, coll, this$.toString(), not_found)
  };
  G__3443 = function(this$, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3443__3444.call(this, this$, coll);
      case 3:
        return G__3443__3445.call(this, this$, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3443
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__3447 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__3447
  }else {
    lazy_seq.x = x__3447.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3448 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3449 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3450 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3451 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3451.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3452 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3453 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3454 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3455 = this;
  return this__3455.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3456 = this;
  return new cljs.core.LazySeq(meta, this__3456.realized, this__3456.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__3457 = cljs.core.array.call(null);
  var s__3458 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__3458))) {
      ary__3457.push(cljs.core.first.call(null, s__3458));
      var G__3459 = cljs.core.next.call(null, s__3458);
      s__3458 = G__3459;
      continue
    }else {
      return ary__3457
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__3460 = s;
  var i__3461 = n;
  var sum__3462 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____3463 = i__3461 > 0;
      if(cljs.core.truth_(and__3691__auto____3463)) {
        return cljs.core.seq.call(null, s__3460)
      }else {
        return and__3691__auto____3463
      }
    }())) {
      var G__3464 = cljs.core.next.call(null, s__3460);
      var G__3465 = i__3461 - 1;
      var G__3466 = sum__3462 + 1;
      s__3460 = G__3464;
      i__3461 = G__3465;
      sum__3462 = G__3466;
      continue
    }else {
      return sum__3462
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, arglist))) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, cljs.core.next.call(null, arglist)))) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__3470 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__3471 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__3472 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__3467 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__3467)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3467), concat.call(null, cljs.core.rest.call(null, s__3467), y))
      }else {
        return y
      }
    })
  };
  var concat__3473 = function() {
    var G__3475__delegate = function(x, y, zs) {
      var cat__3469 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__3468 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__3468)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__3468), cat.call(null, cljs.core.rest.call(null, xys__3468), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__3469.call(null, concat.call(null, x, y), zs)
    };
    var G__3475 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3475__delegate.call(this, x, y, zs)
    };
    G__3475.cljs$lang$maxFixedArity = 2;
    G__3475.cljs$lang$applyTo = function(arglist__3476) {
      var x = cljs.core.first(arglist__3476);
      var y = cljs.core.first(cljs.core.next(arglist__3476));
      var zs = cljs.core.rest(cljs.core.next(arglist__3476));
      return G__3475__delegate.call(this, x, y, zs)
    };
    return G__3475
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__3470.call(this);
      case 1:
        return concat__3471.call(this, x);
      case 2:
        return concat__3472.call(this, x, y);
      default:
        return concat__3473.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3473.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___3477 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___3478 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3479 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___3480 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___3481 = function() {
    var G__3483__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3483 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3483__delegate.call(this, a, b, c, d, more)
    };
    G__3483.cljs$lang$maxFixedArity = 4;
    G__3483.cljs$lang$applyTo = function(arglist__3484) {
      var a = cljs.core.first(arglist__3484);
      var b = cljs.core.first(cljs.core.next(arglist__3484));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3484)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3484))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3484))));
      return G__3483__delegate.call(this, a, b, c, d, more)
    };
    return G__3483
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___3477.call(this, a);
      case 2:
        return list_STAR___3478.call(this, a, b);
      case 3:
        return list_STAR___3479.call(this, a, b, c);
      case 4:
        return list_STAR___3480.call(this, a, b, c, d);
      default:
        return list_STAR___3481.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___3481.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__3494 = function(f, args) {
    var fixed_arity__3485 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__3485 + 1) <= fixed_arity__3485)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3495 = function(f, x, args) {
    var arglist__3486 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__3487 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3486, fixed_arity__3487) <= fixed_arity__3487)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3486))
      }else {
        return f.cljs$lang$applyTo(arglist__3486)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3486))
    }
  };
  var apply__3496 = function(f, x, y, args) {
    var arglist__3488 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__3489 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3488, fixed_arity__3489) <= fixed_arity__3489)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3488))
      }else {
        return f.cljs$lang$applyTo(arglist__3488)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3488))
    }
  };
  var apply__3497 = function(f, x, y, z, args) {
    var arglist__3490 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__3491 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3490, fixed_arity__3491) <= fixed_arity__3491)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3490))
      }else {
        return f.cljs$lang$applyTo(arglist__3490)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3490))
    }
  };
  var apply__3498 = function() {
    var G__3500__delegate = function(f, a, b, c, d, args) {
      var arglist__3492 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__3493 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3492, fixed_arity__3493) <= fixed_arity__3493)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__3492))
        }else {
          return f.cljs$lang$applyTo(arglist__3492)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3492))
      }
    };
    var G__3500 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3500__delegate.call(this, f, a, b, c, d, args)
    };
    G__3500.cljs$lang$maxFixedArity = 5;
    G__3500.cljs$lang$applyTo = function(arglist__3501) {
      var f = cljs.core.first(arglist__3501);
      var a = cljs.core.first(cljs.core.next(arglist__3501));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3501)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3501))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3501)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3501)))));
      return G__3500__delegate.call(this, f, a, b, c, d, args)
    };
    return G__3500
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__3494.call(this, f, a);
      case 3:
        return apply__3495.call(this, f, a, b);
      case 4:
        return apply__3496.call(this, f, a, b, c);
      case 5:
        return apply__3497.call(this, f, a, b, c, d);
      default:
        return apply__3498.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__3498.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3502) {
    var obj = cljs.core.first(arglist__3502);
    var f = cljs.core.first(cljs.core.next(arglist__3502));
    var args = cljs.core.rest(cljs.core.next(arglist__3502));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___3503 = function(x) {
    return false
  };
  var not_EQ___3504 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3505 = function() {
    var G__3507__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3507 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3507__delegate.call(this, x, y, more)
    };
    G__3507.cljs$lang$maxFixedArity = 2;
    G__3507.cljs$lang$applyTo = function(arglist__3508) {
      var x = cljs.core.first(arglist__3508);
      var y = cljs.core.first(cljs.core.next(arglist__3508));
      var more = cljs.core.rest(cljs.core.next(arglist__3508));
      return G__3507__delegate.call(this, x, y, more)
    };
    return G__3507
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___3503.call(this, x);
      case 2:
        return not_EQ___3504.call(this, x, y);
      default:
        return not_EQ___3505.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3505.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, cljs.core.seq.call(null, coll)))) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3509 = pred;
        var G__3510 = cljs.core.next.call(null, coll);
        pred = G__3509;
        coll = G__3510;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3693__auto____3511 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3693__auto____3511)) {
        return or__3693__auto____3511
      }else {
        var G__3512 = pred;
        var G__3513 = cljs.core.next.call(null, coll);
        pred = G__3512;
        coll = G__3513;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3514 = null;
    var G__3514__3515 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3514__3516 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3514__3517 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3514__3518 = function() {
      var G__3520__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3520 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3520__delegate.call(this, x, y, zs)
      };
      G__3520.cljs$lang$maxFixedArity = 2;
      G__3520.cljs$lang$applyTo = function(arglist__3521) {
        var x = cljs.core.first(arglist__3521);
        var y = cljs.core.first(cljs.core.next(arglist__3521));
        var zs = cljs.core.rest(cljs.core.next(arglist__3521));
        return G__3520__delegate.call(this, x, y, zs)
      };
      return G__3520
    }();
    G__3514 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3514__3515.call(this);
        case 1:
          return G__3514__3516.call(this, x);
        case 2:
          return G__3514__3517.call(this, x, y);
        default:
          return G__3514__3518.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__3514.cljs$lang$maxFixedArity = 2;
    G__3514.cljs$lang$applyTo = G__3514__3518.cljs$lang$applyTo;
    return G__3514
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3522__delegate = function(args) {
      return x
    };
    var G__3522 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3522__delegate.call(this, args)
    };
    G__3522.cljs$lang$maxFixedArity = 0;
    G__3522.cljs$lang$applyTo = function(arglist__3523) {
      var args = cljs.core.seq(arglist__3523);
      return G__3522__delegate.call(this, args)
    };
    return G__3522
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__3527 = function() {
    return cljs.core.identity
  };
  var comp__3528 = function(f) {
    return f
  };
  var comp__3529 = function(f, g) {
    return function() {
      var G__3533 = null;
      var G__3533__3534 = function() {
        return f.call(null, g.call(null))
      };
      var G__3533__3535 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3533__3536 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3533__3537 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3533__3538 = function() {
        var G__3540__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3540 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3540__delegate.call(this, x, y, z, args)
        };
        G__3540.cljs$lang$maxFixedArity = 3;
        G__3540.cljs$lang$applyTo = function(arglist__3541) {
          var x = cljs.core.first(arglist__3541);
          var y = cljs.core.first(cljs.core.next(arglist__3541));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3541)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3541)));
          return G__3540__delegate.call(this, x, y, z, args)
        };
        return G__3540
      }();
      G__3533 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3533__3534.call(this);
          case 1:
            return G__3533__3535.call(this, x);
          case 2:
            return G__3533__3536.call(this, x, y);
          case 3:
            return G__3533__3537.call(this, x, y, z);
          default:
            return G__3533__3538.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3533.cljs$lang$maxFixedArity = 3;
      G__3533.cljs$lang$applyTo = G__3533__3538.cljs$lang$applyTo;
      return G__3533
    }()
  };
  var comp__3530 = function(f, g, h) {
    return function() {
      var G__3542 = null;
      var G__3542__3543 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3542__3544 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3542__3545 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3542__3546 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3542__3547 = function() {
        var G__3549__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3549 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3549__delegate.call(this, x, y, z, args)
        };
        G__3549.cljs$lang$maxFixedArity = 3;
        G__3549.cljs$lang$applyTo = function(arglist__3550) {
          var x = cljs.core.first(arglist__3550);
          var y = cljs.core.first(cljs.core.next(arglist__3550));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3550)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3550)));
          return G__3549__delegate.call(this, x, y, z, args)
        };
        return G__3549
      }();
      G__3542 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3542__3543.call(this);
          case 1:
            return G__3542__3544.call(this, x);
          case 2:
            return G__3542__3545.call(this, x, y);
          case 3:
            return G__3542__3546.call(this, x, y, z);
          default:
            return G__3542__3547.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3542.cljs$lang$maxFixedArity = 3;
      G__3542.cljs$lang$applyTo = G__3542__3547.cljs$lang$applyTo;
      return G__3542
    }()
  };
  var comp__3531 = function() {
    var G__3551__delegate = function(f1, f2, f3, fs) {
      var fs__3524 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3552__delegate = function(args) {
          var ret__3525 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__3524), args);
          var fs__3526 = cljs.core.next.call(null, fs__3524);
          while(true) {
            if(cljs.core.truth_(fs__3526)) {
              var G__3553 = cljs.core.first.call(null, fs__3526).call(null, ret__3525);
              var G__3554 = cljs.core.next.call(null, fs__3526);
              ret__3525 = G__3553;
              fs__3526 = G__3554;
              continue
            }else {
              return ret__3525
            }
            break
          }
        };
        var G__3552 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3552__delegate.call(this, args)
        };
        G__3552.cljs$lang$maxFixedArity = 0;
        G__3552.cljs$lang$applyTo = function(arglist__3555) {
          var args = cljs.core.seq(arglist__3555);
          return G__3552__delegate.call(this, args)
        };
        return G__3552
      }()
    };
    var G__3551 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3551__delegate.call(this, f1, f2, f3, fs)
    };
    G__3551.cljs$lang$maxFixedArity = 3;
    G__3551.cljs$lang$applyTo = function(arglist__3556) {
      var f1 = cljs.core.first(arglist__3556);
      var f2 = cljs.core.first(cljs.core.next(arglist__3556));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3556)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3556)));
      return G__3551__delegate.call(this, f1, f2, f3, fs)
    };
    return G__3551
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__3527.call(this);
      case 1:
        return comp__3528.call(this, f1);
      case 2:
        return comp__3529.call(this, f1, f2);
      case 3:
        return comp__3530.call(this, f1, f2, f3);
      default:
        return comp__3531.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__3531.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__3557 = function(f, arg1) {
    return function() {
      var G__3562__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3562 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3562__delegate.call(this, args)
      };
      G__3562.cljs$lang$maxFixedArity = 0;
      G__3562.cljs$lang$applyTo = function(arglist__3563) {
        var args = cljs.core.seq(arglist__3563);
        return G__3562__delegate.call(this, args)
      };
      return G__3562
    }()
  };
  var partial__3558 = function(f, arg1, arg2) {
    return function() {
      var G__3564__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3564 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3564__delegate.call(this, args)
      };
      G__3564.cljs$lang$maxFixedArity = 0;
      G__3564.cljs$lang$applyTo = function(arglist__3565) {
        var args = cljs.core.seq(arglist__3565);
        return G__3564__delegate.call(this, args)
      };
      return G__3564
    }()
  };
  var partial__3559 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3566__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3566 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3566__delegate.call(this, args)
      };
      G__3566.cljs$lang$maxFixedArity = 0;
      G__3566.cljs$lang$applyTo = function(arglist__3567) {
        var args = cljs.core.seq(arglist__3567);
        return G__3566__delegate.call(this, args)
      };
      return G__3566
    }()
  };
  var partial__3560 = function() {
    var G__3568__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3569__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3569 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3569__delegate.call(this, args)
        };
        G__3569.cljs$lang$maxFixedArity = 0;
        G__3569.cljs$lang$applyTo = function(arglist__3570) {
          var args = cljs.core.seq(arglist__3570);
          return G__3569__delegate.call(this, args)
        };
        return G__3569
      }()
    };
    var G__3568 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3568__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3568.cljs$lang$maxFixedArity = 4;
    G__3568.cljs$lang$applyTo = function(arglist__3571) {
      var f = cljs.core.first(arglist__3571);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3571));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3571)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3571))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3571))));
      return G__3568__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__3568
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__3557.call(this, f, arg1);
      case 3:
        return partial__3558.call(this, f, arg1, arg2);
      case 4:
        return partial__3559.call(this, f, arg1, arg2, arg3);
      default:
        return partial__3560.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__3560.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__3572 = function(f, x) {
    return function() {
      var G__3576 = null;
      var G__3576__3577 = function(a) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a)
      };
      var G__3576__3578 = function(a, b) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, b)
      };
      var G__3576__3579 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, b, c)
      };
      var G__3576__3580 = function() {
        var G__3582__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, b, c, ds)
        };
        var G__3582 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3582__delegate.call(this, a, b, c, ds)
        };
        G__3582.cljs$lang$maxFixedArity = 3;
        G__3582.cljs$lang$applyTo = function(arglist__3583) {
          var a = cljs.core.first(arglist__3583);
          var b = cljs.core.first(cljs.core.next(arglist__3583));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3583)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3583)));
          return G__3582__delegate.call(this, a, b, c, ds)
        };
        return G__3582
      }();
      G__3576 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3576__3577.call(this, a);
          case 2:
            return G__3576__3578.call(this, a, b);
          case 3:
            return G__3576__3579.call(this, a, b, c);
          default:
            return G__3576__3580.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3576.cljs$lang$maxFixedArity = 3;
      G__3576.cljs$lang$applyTo = G__3576__3580.cljs$lang$applyTo;
      return G__3576
    }()
  };
  var fnil__3573 = function(f, x, y) {
    return function() {
      var G__3584 = null;
      var G__3584__3585 = function(a, b) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b)
      };
      var G__3584__3586 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, c)
      };
      var G__3584__3587 = function() {
        var G__3589__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, c, ds)
        };
        var G__3589 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3589__delegate.call(this, a, b, c, ds)
        };
        G__3589.cljs$lang$maxFixedArity = 3;
        G__3589.cljs$lang$applyTo = function(arglist__3590) {
          var a = cljs.core.first(arglist__3590);
          var b = cljs.core.first(cljs.core.next(arglist__3590));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3590)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3590)));
          return G__3589__delegate.call(this, a, b, c, ds)
        };
        return G__3589
      }();
      G__3584 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3584__3585.call(this, a, b);
          case 3:
            return G__3584__3586.call(this, a, b, c);
          default:
            return G__3584__3587.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3584.cljs$lang$maxFixedArity = 3;
      G__3584.cljs$lang$applyTo = G__3584__3587.cljs$lang$applyTo;
      return G__3584
    }()
  };
  var fnil__3574 = function(f, x, y, z) {
    return function() {
      var G__3591 = null;
      var G__3591__3592 = function(a, b) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b)
      };
      var G__3591__3593 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, c)) ? z : c)
      };
      var G__3591__3594 = function() {
        var G__3596__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, a)) ? x : a, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, b)) ? y : b, cljs.core.truth_(cljs.core.nil_QMARK_.call(null, c)) ? z : c, ds)
        };
        var G__3596 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3596__delegate.call(this, a, b, c, ds)
        };
        G__3596.cljs$lang$maxFixedArity = 3;
        G__3596.cljs$lang$applyTo = function(arglist__3597) {
          var a = cljs.core.first(arglist__3597);
          var b = cljs.core.first(cljs.core.next(arglist__3597));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3597)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3597)));
          return G__3596__delegate.call(this, a, b, c, ds)
        };
        return G__3596
      }();
      G__3591 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3591__3592.call(this, a, b);
          case 3:
            return G__3591__3593.call(this, a, b, c);
          default:
            return G__3591__3594.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3591.cljs$lang$maxFixedArity = 3;
      G__3591.cljs$lang$applyTo = G__3591__3594.cljs$lang$applyTo;
      return G__3591
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__3572.call(this, f, x);
      case 3:
        return fnil__3573.call(this, f, x, y);
      case 4:
        return fnil__3574.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__3600 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____3598 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____3598)) {
        var s__3599 = temp__3843__auto____3598;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__3599)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__3599)))
      }else {
        return null
      }
    })
  };
  return mapi__3600.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3843__auto____3601 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3843__auto____3601)) {
      var s__3602 = temp__3843__auto____3601;
      var x__3603 = f.call(null, cljs.core.first.call(null, s__3602));
      if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x__3603))) {
        return keep.call(null, f, cljs.core.rest.call(null, s__3602))
      }else {
        return cljs.core.cons.call(null, x__3603, keep.call(null, f, cljs.core.rest.call(null, s__3602)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__3613 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____3610 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____3610)) {
        var s__3611 = temp__3843__auto____3610;
        var x__3612 = f.call(null, idx, cljs.core.first.call(null, s__3611));
        if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, x__3612))) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3611))
        }else {
          return cljs.core.cons.call(null, x__3612, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3611)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__3613.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__3658 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__3663 = function() {
        return true
      };
      var ep1__3664 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__3665 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3620 = p.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3620)) {
            return p.call(null, y)
          }else {
            return and__3691__auto____3620
          }
        }())
      };
      var ep1__3666 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3621 = p.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3621)) {
            var and__3691__auto____3622 = p.call(null, y);
            if(cljs.core.truth_(and__3691__auto____3622)) {
              return p.call(null, z)
            }else {
              return and__3691__auto____3622
            }
          }else {
            return and__3691__auto____3621
          }
        }())
      };
      var ep1__3667 = function() {
        var G__3669__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3691__auto____3623 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3691__auto____3623)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3691__auto____3623
            }
          }())
        };
        var G__3669 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3669__delegate.call(this, x, y, z, args)
        };
        G__3669.cljs$lang$maxFixedArity = 3;
        G__3669.cljs$lang$applyTo = function(arglist__3670) {
          var x = cljs.core.first(arglist__3670);
          var y = cljs.core.first(cljs.core.next(arglist__3670));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3670)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3670)));
          return G__3669__delegate.call(this, x, y, z, args)
        };
        return G__3669
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__3663.call(this);
          case 1:
            return ep1__3664.call(this, x);
          case 2:
            return ep1__3665.call(this, x, y);
          case 3:
            return ep1__3666.call(this, x, y, z);
          default:
            return ep1__3667.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__3667.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__3659 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__3671 = function() {
        return true
      };
      var ep2__3672 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3624 = p1.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3624)) {
            return p2.call(null, x)
          }else {
            return and__3691__auto____3624
          }
        }())
      };
      var ep2__3673 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3625 = p1.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3625)) {
            var and__3691__auto____3626 = p1.call(null, y);
            if(cljs.core.truth_(and__3691__auto____3626)) {
              var and__3691__auto____3627 = p2.call(null, x);
              if(cljs.core.truth_(and__3691__auto____3627)) {
                return p2.call(null, y)
              }else {
                return and__3691__auto____3627
              }
            }else {
              return and__3691__auto____3626
            }
          }else {
            return and__3691__auto____3625
          }
        }())
      };
      var ep2__3674 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3628 = p1.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3628)) {
            var and__3691__auto____3629 = p1.call(null, y);
            if(cljs.core.truth_(and__3691__auto____3629)) {
              var and__3691__auto____3630 = p1.call(null, z);
              if(cljs.core.truth_(and__3691__auto____3630)) {
                var and__3691__auto____3631 = p2.call(null, x);
                if(cljs.core.truth_(and__3691__auto____3631)) {
                  var and__3691__auto____3632 = p2.call(null, y);
                  if(cljs.core.truth_(and__3691__auto____3632)) {
                    return p2.call(null, z)
                  }else {
                    return and__3691__auto____3632
                  }
                }else {
                  return and__3691__auto____3631
                }
              }else {
                return and__3691__auto____3630
              }
            }else {
              return and__3691__auto____3629
            }
          }else {
            return and__3691__auto____3628
          }
        }())
      };
      var ep2__3675 = function() {
        var G__3677__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3691__auto____3633 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3691__auto____3633)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3604_SHARP_) {
                var and__3691__auto____3634 = p1.call(null, p1__3604_SHARP_);
                if(cljs.core.truth_(and__3691__auto____3634)) {
                  return p2.call(null, p1__3604_SHARP_)
                }else {
                  return and__3691__auto____3634
                }
              }, args)
            }else {
              return and__3691__auto____3633
            }
          }())
        };
        var G__3677 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3677__delegate.call(this, x, y, z, args)
        };
        G__3677.cljs$lang$maxFixedArity = 3;
        G__3677.cljs$lang$applyTo = function(arglist__3678) {
          var x = cljs.core.first(arglist__3678);
          var y = cljs.core.first(cljs.core.next(arglist__3678));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3678)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3678)));
          return G__3677__delegate.call(this, x, y, z, args)
        };
        return G__3677
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__3671.call(this);
          case 1:
            return ep2__3672.call(this, x);
          case 2:
            return ep2__3673.call(this, x, y);
          case 3:
            return ep2__3674.call(this, x, y, z);
          default:
            return ep2__3675.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__3675.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__3660 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__3679 = function() {
        return true
      };
      var ep3__3680 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3635 = p1.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3635)) {
            var and__3691__auto____3636 = p2.call(null, x);
            if(cljs.core.truth_(and__3691__auto____3636)) {
              return p3.call(null, x)
            }else {
              return and__3691__auto____3636
            }
          }else {
            return and__3691__auto____3635
          }
        }())
      };
      var ep3__3681 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3637 = p1.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3637)) {
            var and__3691__auto____3638 = p2.call(null, x);
            if(cljs.core.truth_(and__3691__auto____3638)) {
              var and__3691__auto____3639 = p3.call(null, x);
              if(cljs.core.truth_(and__3691__auto____3639)) {
                var and__3691__auto____3640 = p1.call(null, y);
                if(cljs.core.truth_(and__3691__auto____3640)) {
                  var and__3691__auto____3641 = p2.call(null, y);
                  if(cljs.core.truth_(and__3691__auto____3641)) {
                    return p3.call(null, y)
                  }else {
                    return and__3691__auto____3641
                  }
                }else {
                  return and__3691__auto____3640
                }
              }else {
                return and__3691__auto____3639
              }
            }else {
              return and__3691__auto____3638
            }
          }else {
            return and__3691__auto____3637
          }
        }())
      };
      var ep3__3682 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3691__auto____3642 = p1.call(null, x);
          if(cljs.core.truth_(and__3691__auto____3642)) {
            var and__3691__auto____3643 = p2.call(null, x);
            if(cljs.core.truth_(and__3691__auto____3643)) {
              var and__3691__auto____3644 = p3.call(null, x);
              if(cljs.core.truth_(and__3691__auto____3644)) {
                var and__3691__auto____3645 = p1.call(null, y);
                if(cljs.core.truth_(and__3691__auto____3645)) {
                  var and__3691__auto____3646 = p2.call(null, y);
                  if(cljs.core.truth_(and__3691__auto____3646)) {
                    var and__3691__auto____3647 = p3.call(null, y);
                    if(cljs.core.truth_(and__3691__auto____3647)) {
                      var and__3691__auto____3648 = p1.call(null, z);
                      if(cljs.core.truth_(and__3691__auto____3648)) {
                        var and__3691__auto____3649 = p2.call(null, z);
                        if(cljs.core.truth_(and__3691__auto____3649)) {
                          return p3.call(null, z)
                        }else {
                          return and__3691__auto____3649
                        }
                      }else {
                        return and__3691__auto____3648
                      }
                    }else {
                      return and__3691__auto____3647
                    }
                  }else {
                    return and__3691__auto____3646
                  }
                }else {
                  return and__3691__auto____3645
                }
              }else {
                return and__3691__auto____3644
              }
            }else {
              return and__3691__auto____3643
            }
          }else {
            return and__3691__auto____3642
          }
        }())
      };
      var ep3__3683 = function() {
        var G__3685__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3691__auto____3650 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3691__auto____3650)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3605_SHARP_) {
                var and__3691__auto____3651 = p1.call(null, p1__3605_SHARP_);
                if(cljs.core.truth_(and__3691__auto____3651)) {
                  var and__3691__auto____3652 = p2.call(null, p1__3605_SHARP_);
                  if(cljs.core.truth_(and__3691__auto____3652)) {
                    return p3.call(null, p1__3605_SHARP_)
                  }else {
                    return and__3691__auto____3652
                  }
                }else {
                  return and__3691__auto____3651
                }
              }, args)
            }else {
              return and__3691__auto____3650
            }
          }())
        };
        var G__3685 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3685__delegate.call(this, x, y, z, args)
        };
        G__3685.cljs$lang$maxFixedArity = 3;
        G__3685.cljs$lang$applyTo = function(arglist__3686) {
          var x = cljs.core.first(arglist__3686);
          var y = cljs.core.first(cljs.core.next(arglist__3686));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3686)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3686)));
          return G__3685__delegate.call(this, x, y, z, args)
        };
        return G__3685
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__3679.call(this);
          case 1:
            return ep3__3680.call(this, x);
          case 2:
            return ep3__3681.call(this, x, y);
          case 3:
            return ep3__3682.call(this, x, y, z);
          default:
            return ep3__3683.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__3683.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__3661 = function() {
    var G__3687__delegate = function(p1, p2, p3, ps) {
      var ps__3653 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__3688 = function() {
          return true
        };
        var epn__3689 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3606_SHARP_) {
            return p1__3606_SHARP_.call(null, x)
          }, ps__3653)
        };
        var epn__3690 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3607_SHARP_) {
            var and__3691__auto____3654 = p1__3607_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3691__auto____3654)) {
              return p1__3607_SHARP_.call(null, y)
            }else {
              return and__3691__auto____3654
            }
          }, ps__3653)
        };
        var epn__3691 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3608_SHARP_) {
            var and__3691__auto____3655 = p1__3608_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3691__auto____3655)) {
              var and__3691__auto____3656 = p1__3608_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3691__auto____3656)) {
                return p1__3608_SHARP_.call(null, z)
              }else {
                return and__3691__auto____3656
              }
            }else {
              return and__3691__auto____3655
            }
          }, ps__3653)
        };
        var epn__3692 = function() {
          var G__3694__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3691__auto____3657 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3691__auto____3657)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3609_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3609_SHARP_, args)
                }, ps__3653)
              }else {
                return and__3691__auto____3657
              }
            }())
          };
          var G__3694 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3694__delegate.call(this, x, y, z, args)
          };
          G__3694.cljs$lang$maxFixedArity = 3;
          G__3694.cljs$lang$applyTo = function(arglist__3695) {
            var x = cljs.core.first(arglist__3695);
            var y = cljs.core.first(cljs.core.next(arglist__3695));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3695)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3695)));
            return G__3694__delegate.call(this, x, y, z, args)
          };
          return G__3694
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__3688.call(this);
            case 1:
              return epn__3689.call(this, x);
            case 2:
              return epn__3690.call(this, x, y);
            case 3:
              return epn__3691.call(this, x, y, z);
            default:
              return epn__3692.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__3692.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__3687 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3687__delegate.call(this, p1, p2, p3, ps)
    };
    G__3687.cljs$lang$maxFixedArity = 3;
    G__3687.cljs$lang$applyTo = function(arglist__3696) {
      var p1 = cljs.core.first(arglist__3696);
      var p2 = cljs.core.first(cljs.core.next(arglist__3696));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3696)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3696)));
      return G__3687__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3687
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__3658.call(this, p1);
      case 2:
        return every_pred__3659.call(this, p1, p2);
      case 3:
        return every_pred__3660.call(this, p1, p2, p3);
      default:
        return every_pred__3661.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__3661.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__3736 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__3741 = function() {
        return null
      };
      var sp1__3742 = function(x) {
        return p.call(null, x)
      };
      var sp1__3743 = function(x, y) {
        var or__3693__auto____3698 = p.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3698)) {
          return or__3693__auto____3698
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3744 = function(x, y, z) {
        var or__3693__auto____3699 = p.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3699)) {
          return or__3693__auto____3699
        }else {
          var or__3693__auto____3700 = p.call(null, y);
          if(cljs.core.truth_(or__3693__auto____3700)) {
            return or__3693__auto____3700
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__3745 = function() {
        var G__3747__delegate = function(x, y, z, args) {
          var or__3693__auto____3701 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3693__auto____3701)) {
            return or__3693__auto____3701
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__3747 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3747__delegate.call(this, x, y, z, args)
        };
        G__3747.cljs$lang$maxFixedArity = 3;
        G__3747.cljs$lang$applyTo = function(arglist__3748) {
          var x = cljs.core.first(arglist__3748);
          var y = cljs.core.first(cljs.core.next(arglist__3748));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3748)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3748)));
          return G__3747__delegate.call(this, x, y, z, args)
        };
        return G__3747
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__3741.call(this);
          case 1:
            return sp1__3742.call(this, x);
          case 2:
            return sp1__3743.call(this, x, y);
          case 3:
            return sp1__3744.call(this, x, y, z);
          default:
            return sp1__3745.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__3745.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__3737 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__3749 = function() {
        return null
      };
      var sp2__3750 = function(x) {
        var or__3693__auto____3702 = p1.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3702)) {
          return or__3693__auto____3702
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__3751 = function(x, y) {
        var or__3693__auto____3703 = p1.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3703)) {
          return or__3693__auto____3703
        }else {
          var or__3693__auto____3704 = p1.call(null, y);
          if(cljs.core.truth_(or__3693__auto____3704)) {
            return or__3693__auto____3704
          }else {
            var or__3693__auto____3705 = p2.call(null, x);
            if(cljs.core.truth_(or__3693__auto____3705)) {
              return or__3693__auto____3705
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3752 = function(x, y, z) {
        var or__3693__auto____3706 = p1.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3706)) {
          return or__3693__auto____3706
        }else {
          var or__3693__auto____3707 = p1.call(null, y);
          if(cljs.core.truth_(or__3693__auto____3707)) {
            return or__3693__auto____3707
          }else {
            var or__3693__auto____3708 = p1.call(null, z);
            if(cljs.core.truth_(or__3693__auto____3708)) {
              return or__3693__auto____3708
            }else {
              var or__3693__auto____3709 = p2.call(null, x);
              if(cljs.core.truth_(or__3693__auto____3709)) {
                return or__3693__auto____3709
              }else {
                var or__3693__auto____3710 = p2.call(null, y);
                if(cljs.core.truth_(or__3693__auto____3710)) {
                  return or__3693__auto____3710
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__3753 = function() {
        var G__3755__delegate = function(x, y, z, args) {
          var or__3693__auto____3711 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3693__auto____3711)) {
            return or__3693__auto____3711
          }else {
            return cljs.core.some.call(null, function(p1__3614_SHARP_) {
              var or__3693__auto____3712 = p1.call(null, p1__3614_SHARP_);
              if(cljs.core.truth_(or__3693__auto____3712)) {
                return or__3693__auto____3712
              }else {
                return p2.call(null, p1__3614_SHARP_)
              }
            }, args)
          }
        };
        var G__3755 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3755__delegate.call(this, x, y, z, args)
        };
        G__3755.cljs$lang$maxFixedArity = 3;
        G__3755.cljs$lang$applyTo = function(arglist__3756) {
          var x = cljs.core.first(arglist__3756);
          var y = cljs.core.first(cljs.core.next(arglist__3756));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3756)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3756)));
          return G__3755__delegate.call(this, x, y, z, args)
        };
        return G__3755
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__3749.call(this);
          case 1:
            return sp2__3750.call(this, x);
          case 2:
            return sp2__3751.call(this, x, y);
          case 3:
            return sp2__3752.call(this, x, y, z);
          default:
            return sp2__3753.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__3753.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__3738 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__3757 = function() {
        return null
      };
      var sp3__3758 = function(x) {
        var or__3693__auto____3713 = p1.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3713)) {
          return or__3693__auto____3713
        }else {
          var or__3693__auto____3714 = p2.call(null, x);
          if(cljs.core.truth_(or__3693__auto____3714)) {
            return or__3693__auto____3714
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__3759 = function(x, y) {
        var or__3693__auto____3715 = p1.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3715)) {
          return or__3693__auto____3715
        }else {
          var or__3693__auto____3716 = p2.call(null, x);
          if(cljs.core.truth_(or__3693__auto____3716)) {
            return or__3693__auto____3716
          }else {
            var or__3693__auto____3717 = p3.call(null, x);
            if(cljs.core.truth_(or__3693__auto____3717)) {
              return or__3693__auto____3717
            }else {
              var or__3693__auto____3718 = p1.call(null, y);
              if(cljs.core.truth_(or__3693__auto____3718)) {
                return or__3693__auto____3718
              }else {
                var or__3693__auto____3719 = p2.call(null, y);
                if(cljs.core.truth_(or__3693__auto____3719)) {
                  return or__3693__auto____3719
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3760 = function(x, y, z) {
        var or__3693__auto____3720 = p1.call(null, x);
        if(cljs.core.truth_(or__3693__auto____3720)) {
          return or__3693__auto____3720
        }else {
          var or__3693__auto____3721 = p2.call(null, x);
          if(cljs.core.truth_(or__3693__auto____3721)) {
            return or__3693__auto____3721
          }else {
            var or__3693__auto____3722 = p3.call(null, x);
            if(cljs.core.truth_(or__3693__auto____3722)) {
              return or__3693__auto____3722
            }else {
              var or__3693__auto____3723 = p1.call(null, y);
              if(cljs.core.truth_(or__3693__auto____3723)) {
                return or__3693__auto____3723
              }else {
                var or__3693__auto____3724 = p2.call(null, y);
                if(cljs.core.truth_(or__3693__auto____3724)) {
                  return or__3693__auto____3724
                }else {
                  var or__3693__auto____3725 = p3.call(null, y);
                  if(cljs.core.truth_(or__3693__auto____3725)) {
                    return or__3693__auto____3725
                  }else {
                    var or__3693__auto____3726 = p1.call(null, z);
                    if(cljs.core.truth_(or__3693__auto____3726)) {
                      return or__3693__auto____3726
                    }else {
                      var or__3693__auto____3727 = p2.call(null, z);
                      if(cljs.core.truth_(or__3693__auto____3727)) {
                        return or__3693__auto____3727
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__3761 = function() {
        var G__3763__delegate = function(x, y, z, args) {
          var or__3693__auto____3728 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3693__auto____3728)) {
            return or__3693__auto____3728
          }else {
            return cljs.core.some.call(null, function(p1__3615_SHARP_) {
              var or__3693__auto____3729 = p1.call(null, p1__3615_SHARP_);
              if(cljs.core.truth_(or__3693__auto____3729)) {
                return or__3693__auto____3729
              }else {
                var or__3693__auto____3730 = p2.call(null, p1__3615_SHARP_);
                if(cljs.core.truth_(or__3693__auto____3730)) {
                  return or__3693__auto____3730
                }else {
                  return p3.call(null, p1__3615_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__3763 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3763__delegate.call(this, x, y, z, args)
        };
        G__3763.cljs$lang$maxFixedArity = 3;
        G__3763.cljs$lang$applyTo = function(arglist__3764) {
          var x = cljs.core.first(arglist__3764);
          var y = cljs.core.first(cljs.core.next(arglist__3764));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3764)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3764)));
          return G__3763__delegate.call(this, x, y, z, args)
        };
        return G__3763
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__3757.call(this);
          case 1:
            return sp3__3758.call(this, x);
          case 2:
            return sp3__3759.call(this, x, y);
          case 3:
            return sp3__3760.call(this, x, y, z);
          default:
            return sp3__3761.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__3761.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__3739 = function() {
    var G__3765__delegate = function(p1, p2, p3, ps) {
      var ps__3731 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__3766 = function() {
          return null
        };
        var spn__3767 = function(x) {
          return cljs.core.some.call(null, function(p1__3616_SHARP_) {
            return p1__3616_SHARP_.call(null, x)
          }, ps__3731)
        };
        var spn__3768 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3617_SHARP_) {
            var or__3693__auto____3732 = p1__3617_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3693__auto____3732)) {
              return or__3693__auto____3732
            }else {
              return p1__3617_SHARP_.call(null, y)
            }
          }, ps__3731)
        };
        var spn__3769 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3618_SHARP_) {
            var or__3693__auto____3733 = p1__3618_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3693__auto____3733)) {
              return or__3693__auto____3733
            }else {
              var or__3693__auto____3734 = p1__3618_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3693__auto____3734)) {
                return or__3693__auto____3734
              }else {
                return p1__3618_SHARP_.call(null, z)
              }
            }
          }, ps__3731)
        };
        var spn__3770 = function() {
          var G__3772__delegate = function(x, y, z, args) {
            var or__3693__auto____3735 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3693__auto____3735)) {
              return or__3693__auto____3735
            }else {
              return cljs.core.some.call(null, function(p1__3619_SHARP_) {
                return cljs.core.some.call(null, p1__3619_SHARP_, args)
              }, ps__3731)
            }
          };
          var G__3772 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3772__delegate.call(this, x, y, z, args)
          };
          G__3772.cljs$lang$maxFixedArity = 3;
          G__3772.cljs$lang$applyTo = function(arglist__3773) {
            var x = cljs.core.first(arglist__3773);
            var y = cljs.core.first(cljs.core.next(arglist__3773));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3773)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3773)));
            return G__3772__delegate.call(this, x, y, z, args)
          };
          return G__3772
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__3766.call(this);
            case 1:
              return spn__3767.call(this, x);
            case 2:
              return spn__3768.call(this, x, y);
            case 3:
              return spn__3769.call(this, x, y, z);
            default:
              return spn__3770.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__3770.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__3765 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3765__delegate.call(this, p1, p2, p3, ps)
    };
    G__3765.cljs$lang$maxFixedArity = 3;
    G__3765.cljs$lang$applyTo = function(arglist__3774) {
      var p1 = cljs.core.first(arglist__3774);
      var p2 = cljs.core.first(cljs.core.next(arglist__3774));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3774)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3774)));
      return G__3765__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3765
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__3736.call(this, p1);
      case 2:
        return some_fn__3737.call(this, p1, p2);
      case 3:
        return some_fn__3738.call(this, p1, p2, p3);
      default:
        return some_fn__3739.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__3739.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__3787 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____3775 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____3775)) {
        var s__3776 = temp__3843__auto____3775;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__3776)), map.call(null, f, cljs.core.rest.call(null, s__3776)))
      }else {
        return null
      }
    })
  };
  var map__3788 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3777 = cljs.core.seq.call(null, c1);
      var s2__3778 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3691__auto____3779 = s1__3777;
        if(cljs.core.truth_(and__3691__auto____3779)) {
          return s2__3778
        }else {
          return and__3691__auto____3779
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__3777), cljs.core.first.call(null, s2__3778)), map.call(null, f, cljs.core.rest.call(null, s1__3777), cljs.core.rest.call(null, s2__3778)))
      }else {
        return null
      }
    })
  };
  var map__3789 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3780 = cljs.core.seq.call(null, c1);
      var s2__3781 = cljs.core.seq.call(null, c2);
      var s3__3782 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3691__auto____3783 = s1__3780;
        if(cljs.core.truth_(and__3691__auto____3783)) {
          var and__3691__auto____3784 = s2__3781;
          if(cljs.core.truth_(and__3691__auto____3784)) {
            return s3__3782
          }else {
            return and__3691__auto____3784
          }
        }else {
          return and__3691__auto____3783
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__3780), cljs.core.first.call(null, s2__3781), cljs.core.first.call(null, s3__3782)), map.call(null, f, cljs.core.rest.call(null, s1__3780), cljs.core.rest.call(null, s2__3781), cljs.core.rest.call(null, s3__3782)))
      }else {
        return null
      }
    })
  };
  var map__3790 = function() {
    var G__3792__delegate = function(f, c1, c2, c3, colls) {
      var step__3786 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__3785 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__3785))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__3785), step.call(null, map.call(null, cljs.core.rest, ss__3785)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__3697_SHARP_) {
        return cljs.core.apply.call(null, f, p1__3697_SHARP_)
      }, step__3786.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__3792 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3792__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__3792.cljs$lang$maxFixedArity = 4;
    G__3792.cljs$lang$applyTo = function(arglist__3793) {
      var f = cljs.core.first(arglist__3793);
      var c1 = cljs.core.first(cljs.core.next(arglist__3793));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3793)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3793))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3793))));
      return G__3792__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__3792
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__3787.call(this, f, c1);
      case 3:
        return map__3788.call(this, f, c1, c2);
      case 4:
        return map__3789.call(this, f, c1, c2, c3);
      default:
        return map__3790.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__3790.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3843__auto____3794 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____3794)) {
        var s__3795 = temp__3843__auto____3794;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3795), take.call(null, n - 1, cljs.core.rest.call(null, s__3795)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__3798 = function(n, coll) {
    while(true) {
      var s__3796 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3691__auto____3797 = n > 0;
        if(cljs.core.truth_(and__3691__auto____3797)) {
          return s__3796
        }else {
          return and__3691__auto____3797
        }
      }())) {
        var G__3799 = n - 1;
        var G__3800 = cljs.core.rest.call(null, s__3796);
        n = G__3799;
        coll = G__3800;
        continue
      }else {
        return s__3796
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__3798.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__3801 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__3802 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__3801.call(this, n);
      case 2:
        return drop_last__3802.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__3804 = cljs.core.seq.call(null, coll);
  var lead__3805 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__3805)) {
      var G__3806 = cljs.core.next.call(null, s__3804);
      var G__3807 = cljs.core.next.call(null, lead__3805);
      s__3804 = G__3806;
      lead__3805 = G__3807;
      continue
    }else {
      return s__3804
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__3810 = function(pred, coll) {
    while(true) {
      var s__3808 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3691__auto____3809 = s__3808;
        if(cljs.core.truth_(and__3691__auto____3809)) {
          return pred.call(null, cljs.core.first.call(null, s__3808))
        }else {
          return and__3691__auto____3809
        }
      }())) {
        var G__3811 = pred;
        var G__3812 = cljs.core.rest.call(null, s__3808);
        pred = G__3811;
        coll = G__3812;
        continue
      }else {
        return s__3808
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__3810.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3843__auto____3813 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3843__auto____3813)) {
      var s__3814 = temp__3843__auto____3813;
      return cljs.core.concat.call(null, s__3814, cycle.call(null, s__3814))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__3815 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__3816 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__3815.call(this, n);
      case 2:
        return repeat__3816.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__3818 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__3819 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__3818.call(this, n);
      case 2:
        return repeatedly__3819.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__3825 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__3821 = cljs.core.seq.call(null, c1);
      var s2__3822 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3691__auto____3823 = s1__3821;
        if(cljs.core.truth_(and__3691__auto____3823)) {
          return s2__3822
        }else {
          return and__3691__auto____3823
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__3821), cljs.core.cons.call(null, cljs.core.first.call(null, s2__3822), interleave.call(null, cljs.core.rest.call(null, s1__3821), cljs.core.rest.call(null, s2__3822))))
      }else {
        return null
      }
    })
  };
  var interleave__3826 = function() {
    var G__3828__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__3824 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__3824))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__3824), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__3824)))
        }else {
          return null
        }
      })
    };
    var G__3828 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3828__delegate.call(this, c1, c2, colls)
    };
    G__3828.cljs$lang$maxFixedArity = 2;
    G__3828.cljs$lang$applyTo = function(arglist__3829) {
      var c1 = cljs.core.first(arglist__3829);
      var c2 = cljs.core.first(cljs.core.next(arglist__3829));
      var colls = cljs.core.rest(cljs.core.next(arglist__3829));
      return G__3828__delegate.call(this, c1, c2, colls)
    };
    return G__3828
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__3825.call(this, c1, c2);
      default:
        return interleave__3826.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3826.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__3832 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3840__auto____3830 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3840__auto____3830)) {
        var coll__3831 = temp__3840__auto____3830;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__3831), cat.call(null, cljs.core.rest.call(null, coll__3831), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__3832.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__3833 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3834 = function() {
    var G__3836__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__3836 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3836__delegate.call(this, f, coll, colls)
    };
    G__3836.cljs$lang$maxFixedArity = 2;
    G__3836.cljs$lang$applyTo = function(arglist__3837) {
      var f = cljs.core.first(arglist__3837);
      var coll = cljs.core.first(cljs.core.next(arglist__3837));
      var colls = cljs.core.rest(cljs.core.next(arglist__3837));
      return G__3836__delegate.call(this, f, coll, colls)
    };
    return G__3836
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__3833.call(this, f, coll);
      default:
        return mapcat__3834.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3834.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3843__auto____3838 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3843__auto____3838)) {
      var s__3839 = temp__3843__auto____3838;
      var f__3840 = cljs.core.first.call(null, s__3839);
      var r__3841 = cljs.core.rest.call(null, s__3839);
      if(cljs.core.truth_(pred.call(null, f__3840))) {
        return cljs.core.cons.call(null, f__3840, filter.call(null, pred, r__3841))
      }else {
        return filter.call(null, pred, r__3841)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__3843 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__3843.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__3842_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__3842_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__3850 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3851 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____3844 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____3844)) {
        var s__3845 = temp__3843__auto____3844;
        var p__3846 = cljs.core.take.call(null, n, s__3845);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__3846)))) {
          return cljs.core.cons.call(null, p__3846, partition.call(null, n, step, cljs.core.drop.call(null, step, s__3845)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__3852 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____3847 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____3847)) {
        var s__3848 = temp__3843__auto____3847;
        var p__3849 = cljs.core.take.call(null, n, s__3848);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__3849)))) {
          return cljs.core.cons.call(null, p__3849, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__3848)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__3849, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__3850.call(this, n, step);
      case 3:
        return partition__3851.call(this, n, step, pad);
      case 4:
        return partition__3852.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__3858 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3859 = function(m, ks, not_found) {
    var sentinel__3854 = cljs.core.lookup_sentinel;
    var m__3855 = m;
    var ks__3856 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__3856)) {
        var m__3857 = cljs.core.get.call(null, m__3855, cljs.core.first.call(null, ks__3856), sentinel__3854);
        if(cljs.core.truth_(sentinel__3854 === m__3857)) {
          return not_found
        }else {
          var G__3861 = sentinel__3854;
          var G__3862 = m__3857;
          var G__3863 = cljs.core.next.call(null, ks__3856);
          sentinel__3854 = G__3861;
          m__3855 = G__3862;
          ks__3856 = G__3863;
          continue
        }
      }else {
        return m__3855
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__3858.call(this, m, ks);
      case 3:
        return get_in__3859.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__3864, v) {
  var vec__3865__3866 = p__3864;
  var k__3867 = cljs.core.nth.call(null, vec__3865__3866, 0, null);
  var ks__3868 = cljs.core.nthnext.call(null, vec__3865__3866, 1);
  if(cljs.core.truth_(ks__3868)) {
    return cljs.core.assoc.call(null, m, k__3867, assoc_in.call(null, cljs.core.get.call(null, m, k__3867), ks__3868, v))
  }else {
    return cljs.core.assoc.call(null, m, k__3867, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__3869, f, args) {
    var vec__3870__3871 = p__3869;
    var k__3872 = cljs.core.nth.call(null, vec__3870__3871, 0, null);
    var ks__3873 = cljs.core.nthnext.call(null, vec__3870__3871, 1);
    if(cljs.core.truth_(ks__3873)) {
      return cljs.core.assoc.call(null, m, k__3872, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__3872), ks__3873, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__3872, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__3872), args))
    }
  };
  var update_in = function(m, p__3869, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__3869, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__3874) {
    var m = cljs.core.first(arglist__3874);
    var p__3869 = cljs.core.first(cljs.core.next(arglist__3874));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3874)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3874)));
    return update_in__delegate.call(this, m, p__3869, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3875 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__3902 = null;
  var G__3902__3903 = function(coll, k) {
    var this__3876 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__3902__3904 = function(coll, k, not_found) {
    var this__3877 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__3902 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3902__3903.call(this, coll, k);
      case 3:
        return G__3902__3904.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3902
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__3878 = this;
  var new_array__3879 = cljs.core.aclone.call(null, this__3878.array);
  new_array__3879[k] = v;
  return new cljs.core.Vector(this__3878.meta, new_array__3879)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__3906 = null;
  var G__3906__3907 = function(coll, k) {
    var this__3880 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k)
  };
  var G__3906__3908 = function(coll, k, not_found) {
    var this__3881 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k, not_found)
  };
  G__3906 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3906__3907.call(this, coll, k);
      case 3:
        return G__3906__3908.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3906
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3882 = this;
  var new_array__3883 = cljs.core.aclone.call(null, this__3882.array);
  new_array__3883.push(o);
  return new cljs.core.Vector(this__3882.meta, new_array__3883)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3910 = null;
  var G__3910__3911 = function(v, f) {
    var this__3884 = this;
    return cljs.core.ci_reduce.call(null, this__3884.array, f)
  };
  var G__3910__3912 = function(v, f, start) {
    var this__3885 = this;
    return cljs.core.ci_reduce.call(null, this__3885.array, f, start)
  };
  G__3910 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3910__3911.call(this, v, f);
      case 3:
        return G__3910__3912.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3910
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3886 = this;
  if(cljs.core.truth_(this__3886.array.length > 0)) {
    var vector_seq__3887 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__3886.array.length)) {
          return cljs.core.cons.call(null, this__3886.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__3887.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3888 = this;
  return this__3888.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3889 = this;
  var count__3890 = this__3889.array.length;
  if(cljs.core.truth_(count__3890 > 0)) {
    return this__3889.array[count__3890 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3891 = this;
  if(cljs.core.truth_(this__3891.array.length > 0)) {
    var new_array__3892 = cljs.core.aclone.call(null, this__3891.array);
    new_array__3892.pop();
    return new cljs.core.Vector(this__3891.meta, new_array__3892)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__3893 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3894 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3895 = this;
  return new cljs.core.Vector(meta, this__3895.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3896 = this;
  return this__3896.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3914 = null;
  var G__3914__3915 = function(coll, n) {
    var this__3897 = this;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3898 = 0 <= n;
      if(cljs.core.truth_(and__3691__auto____3898)) {
        return n < this__3897.array.length
      }else {
        return and__3691__auto____3898
      }
    }())) {
      return this__3897.array[n]
    }else {
      return null
    }
  };
  var G__3914__3916 = function(coll, n, not_found) {
    var this__3899 = this;
    if(cljs.core.truth_(function() {
      var and__3691__auto____3900 = 0 <= n;
      if(cljs.core.truth_(and__3691__auto____3900)) {
        return n < this__3899.array.length
      }else {
        return and__3691__auto____3900
      }
    }())) {
      return this__3899.array[n]
    }else {
      return not_found
    }
  };
  G__3914 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3914__3915.call(this, coll, n);
      case 3:
        return G__3914__3916.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3914
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3901 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__3901.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__3918) {
    var args = cljs.core.seq(arglist__3918);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3919 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__3941 = null;
  var G__3941__3942 = function(coll, k) {
    var this__3920 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__3941__3943 = function(coll, k, not_found) {
    var this__3921 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__3941 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3941__3942.call(this, coll, k);
      case 3:
        return G__3941__3943.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3941
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__3922 = this;
  var v_pos__3923 = this__3922.start + key;
  return new cljs.core.Subvec(this__3922.meta, cljs.core._assoc.call(null, this__3922.v, v_pos__3923, val), this__3922.start, this__3922.end > v_pos__3923 + 1 ? this__3922.end : v_pos__3923 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__3945 = null;
  var G__3945__3946 = function(coll, k) {
    var this__3924 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k)
  };
  var G__3945__3947 = function(coll, k, not_found) {
    var this__3925 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k, not_found)
  };
  G__3945 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3945__3946.call(this, coll, k);
      case 3:
        return G__3945__3947.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3945
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3926 = this;
  return new cljs.core.Subvec(this__3926.meta, cljs.core._assoc_n.call(null, this__3926.v, this__3926.end, o), this__3926.start, this__3926.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3949 = null;
  var G__3949__3950 = function(coll, f) {
    var this__3927 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__3949__3951 = function(coll, f, start) {
    var this__3928 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__3949 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3949__3950.call(this, coll, f);
      case 3:
        return G__3949__3951.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3949
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3929 = this;
  var subvec_seq__3930 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__3929.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__3929.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__3930.call(null, this__3929.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3931 = this;
  return this__3931.end - this__3931.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3932 = this;
  return cljs.core._nth.call(null, this__3932.v, this__3932.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3933 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__3933.start, this__3933.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__3933.meta, this__3933.v, this__3933.start, this__3933.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__3934 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3935 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3936 = this;
  return new cljs.core.Subvec(meta, this__3936.v, this__3936.start, this__3936.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3937 = this;
  return this__3937.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3953 = null;
  var G__3953__3954 = function(coll, n) {
    var this__3938 = this;
    return cljs.core._nth.call(null, this__3938.v, this__3938.start + n)
  };
  var G__3953__3955 = function(coll, n, not_found) {
    var this__3939 = this;
    return cljs.core._nth.call(null, this__3939.v, this__3939.start + n, not_found)
  };
  G__3953 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3953__3954.call(this, coll, n);
      case 3:
        return G__3953__3955.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3953
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3940 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__3940.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__3957 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3958 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__3957.call(this, v, start);
      case 3:
        return subvec__3958.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3960 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3961 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3962 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3963 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3963.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3964 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3965 = this;
  return cljs.core._first.call(null, this__3965.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3966 = this;
  var temp__3840__auto____3967 = cljs.core.next.call(null, this__3966.front);
  if(cljs.core.truth_(temp__3840__auto____3967)) {
    var f1__3968 = temp__3840__auto____3967;
    return new cljs.core.PersistentQueueSeq(this__3966.meta, f1__3968, this__3966.rear)
  }else {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, this__3966.rear))) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__3966.meta, this__3966.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3969 = this;
  return this__3969.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3970 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__3970.front, this__3970.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3971 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3972 = this;
  if(cljs.core.truth_(this__3972.front)) {
    return new cljs.core.PersistentQueue(this__3972.meta, this__3972.count + 1, this__3972.front, cljs.core.conj.call(null, function() {
      var or__3693__auto____3973 = this__3972.rear;
      if(cljs.core.truth_(or__3693__auto____3973)) {
        return or__3693__auto____3973
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__3972.meta, this__3972.count + 1, cljs.core.conj.call(null, this__3972.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3974 = this;
  var rear__3975 = cljs.core.seq.call(null, this__3974.rear);
  if(cljs.core.truth_(function() {
    var or__3693__auto____3976 = this__3974.front;
    if(cljs.core.truth_(or__3693__auto____3976)) {
      return or__3693__auto____3976
    }else {
      return rear__3975
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__3974.front, cljs.core.seq.call(null, rear__3975))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3977 = this;
  return this__3977.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3978 = this;
  return cljs.core._first.call(null, this__3978.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3979 = this;
  if(cljs.core.truth_(this__3979.front)) {
    var temp__3840__auto____3980 = cljs.core.next.call(null, this__3979.front);
    if(cljs.core.truth_(temp__3840__auto____3980)) {
      var f1__3981 = temp__3840__auto____3980;
      return new cljs.core.PersistentQueue(this__3979.meta, this__3979.count - 1, f1__3981, this__3979.rear)
    }else {
      return new cljs.core.PersistentQueue(this__3979.meta, this__3979.count - 1, cljs.core.seq.call(null, this__3979.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3982 = this;
  return cljs.core.first.call(null, this__3982.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3983 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3984 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3985 = this;
  return new cljs.core.PersistentQueue(meta, this__3985.count, this__3985.front, this__3985.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3986 = this;
  return this__3986.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3987 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__3988 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__3989 = array.length;
  var i__3990 = 0;
  while(true) {
    if(cljs.core.truth_(i__3990 < len__3989)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__3990]))) {
        return i__3990
      }else {
        var G__3991 = i__3990 + incr;
        i__3990 = G__3991;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___3993 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___3994 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____3992 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3691__auto____3992)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3691__auto____3992
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___3993.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___3994.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3997 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4018 = null;
  var G__4018__4019 = function(coll, k) {
    var this__3998 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4018__4020 = function(coll, k, not_found) {
    var this__3999 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__3999.strobj, this__3999.strobj[k], not_found)
  };
  G__4018 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4018__4019.call(this, coll, k);
      case 3:
        return G__4018__4020.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4018
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4000 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__4001 = goog.object.clone.call(null, this__4000.strobj);
    var overwrite_QMARK___4002 = new_strobj__4001.hasOwnProperty(k);
    new_strobj__4001[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___4002)) {
      return new cljs.core.ObjMap(this__4000.meta, this__4000.keys, new_strobj__4001)
    }else {
      var new_keys__4003 = cljs.core.aclone.call(null, this__4000.keys);
      new_keys__4003.push(k);
      return new cljs.core.ObjMap(this__4000.meta, new_keys__4003, new_strobj__4001)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__4000.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4004 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4004.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__4022 = null;
  var G__4022__4023 = function(coll, k) {
    var this__4005 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k)
  };
  var G__4022__4024 = function(coll, k, not_found) {
    var this__4006 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k, not_found)
  };
  G__4022 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4022__4023.call(this, coll, k);
      case 3:
        return G__4022__4024.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4022
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4007 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4008 = this;
  if(cljs.core.truth_(this__4008.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__3996_SHARP_) {
      return cljs.core.vector.call(null, p1__3996_SHARP_, this__4008.strobj[p1__3996_SHARP_])
    }, this__4008.keys)
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4009 = this;
  return this__4009.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4010 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4011 = this;
  return new cljs.core.ObjMap(meta, this__4011.keys, this__4011.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4012 = this;
  return this__4012.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4013 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__4013.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4014 = this;
  if(cljs.core.truth_(function() {
    var and__3691__auto____4015 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3691__auto____4015)) {
      return this__4014.strobj.hasOwnProperty(k)
    }else {
      return and__3691__auto____4015
    }
  }())) {
    var new_keys__4016 = cljs.core.aclone.call(null, this__4014.keys);
    var new_strobj__4017 = goog.object.clone.call(null, this__4014.strobj);
    new_keys__4016.splice(cljs.core.scan_array.call(null, 1, k, new_keys__4016), 1);
    cljs.core.js_delete.call(null, new_strobj__4017, k);
    return new cljs.core.ObjMap(this__4014.meta, new_keys__4016, new_strobj__4017)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4027 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4059 = null;
  var G__4059__4060 = function(coll, k) {
    var this__4028 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4059__4061 = function(coll, k, not_found) {
    var this__4029 = this;
    var bucket__4030 = this__4029.hashobj[cljs.core.hash.call(null, k)];
    var i__4031 = cljs.core.truth_(bucket__4030) ? cljs.core.scan_array.call(null, 2, k, bucket__4030) : null;
    if(cljs.core.truth_(i__4031)) {
      return bucket__4030[i__4031 + 1]
    }else {
      return not_found
    }
  };
  G__4059 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4059__4060.call(this, coll, k);
      case 3:
        return G__4059__4061.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4059
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4032 = this;
  var h__4033 = cljs.core.hash.call(null, k);
  var bucket__4034 = this__4032.hashobj[h__4033];
  if(cljs.core.truth_(bucket__4034)) {
    var new_bucket__4035 = cljs.core.aclone.call(null, bucket__4034);
    var new_hashobj__4036 = goog.object.clone.call(null, this__4032.hashobj);
    new_hashobj__4036[h__4033] = new_bucket__4035;
    var temp__3840__auto____4037 = cljs.core.scan_array.call(null, 2, k, new_bucket__4035);
    if(cljs.core.truth_(temp__3840__auto____4037)) {
      var i__4038 = temp__3840__auto____4037;
      new_bucket__4035[i__4038 + 1] = v;
      return new cljs.core.HashMap(this__4032.meta, this__4032.count, new_hashobj__4036)
    }else {
      new_bucket__4035.push(k, v);
      return new cljs.core.HashMap(this__4032.meta, this__4032.count + 1, new_hashobj__4036)
    }
  }else {
    var new_hashobj__4039 = goog.object.clone.call(null, this__4032.hashobj);
    new_hashobj__4039[h__4033] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__4032.meta, this__4032.count + 1, new_hashobj__4039)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4040 = this;
  var bucket__4041 = this__4040.hashobj[cljs.core.hash.call(null, k)];
  var i__4042 = cljs.core.truth_(bucket__4041) ? cljs.core.scan_array.call(null, 2, k, bucket__4041) : null;
  if(cljs.core.truth_(i__4042)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__4063 = null;
  var G__4063__4064 = function(coll, k) {
    var this__4043 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k)
  };
  var G__4063__4065 = function(coll, k, not_found) {
    var this__4044 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k, not_found)
  };
  G__4063 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4063__4064.call(this, coll, k);
      case 3:
        return G__4063__4065.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4063
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4045 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4046 = this;
  if(cljs.core.truth_(this__4046.count > 0)) {
    var hashes__4047 = cljs.core.js_keys.call(null, this__4046.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__4026_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__4046.hashobj[p1__4026_SHARP_]))
    }, hashes__4047)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4048 = this;
  return this__4048.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4049 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4050 = this;
  return new cljs.core.HashMap(meta, this__4050.count, this__4050.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4051 = this;
  return this__4051.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4052 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__4052.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4053 = this;
  var h__4054 = cljs.core.hash.call(null, k);
  var bucket__4055 = this__4053.hashobj[h__4054];
  var i__4056 = cljs.core.truth_(bucket__4055) ? cljs.core.scan_array.call(null, 2, k, bucket__4055) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__4056))) {
    return coll
  }else {
    var new_hashobj__4057 = goog.object.clone.call(null, this__4053.hashobj);
    if(cljs.core.truth_(3 > bucket__4055.length)) {
      cljs.core.js_delete.call(null, new_hashobj__4057, h__4054)
    }else {
      var new_bucket__4058 = cljs.core.aclone.call(null, bucket__4055);
      new_bucket__4058.splice(i__4056, 2);
      new_hashobj__4057[h__4054] = new_bucket__4058
    }
    return new cljs.core.HashMap(this__4053.meta, this__4053.count - 1, new_hashobj__4057)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__4067 = ks.length;
  var i__4068 = 0;
  var out__4069 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__4068 < len__4067)) {
      var G__4070 = i__4068 + 1;
      var G__4071 = cljs.core.assoc.call(null, out__4069, ks[i__4068], vs[i__4068]);
      i__4068 = G__4070;
      out__4069 = G__4071;
      continue
    }else {
      return out__4069
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__4072 = cljs.core.seq.call(null, keyvals);
    var out__4073 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__4072)) {
        var G__4074 = cljs.core.nnext.call(null, in$__4072);
        var G__4075 = cljs.core.assoc.call(null, out__4073, cljs.core.first.call(null, in$__4072), cljs.core.second.call(null, in$__4072));
        in$__4072 = G__4074;
        out__4073 = G__4075;
        continue
      }else {
        return out__4073
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__4076) {
    var keyvals = cljs.core.seq(arglist__4076);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__4077_SHARP_, p2__4078_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3693__auto____4079 = p1__4077_SHARP_;
          if(cljs.core.truth_(or__3693__auto____4079)) {
            return or__3693__auto____4079
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__4078_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__4080) {
    var maps = cljs.core.seq(arglist__4080);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__4083 = function(m, e) {
        var k__4081 = cljs.core.first.call(null, e);
        var v__4082 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__4081))) {
          return cljs.core.assoc.call(null, m, k__4081, f.call(null, cljs.core.get.call(null, m, k__4081), v__4082))
        }else {
          return cljs.core.assoc.call(null, m, k__4081, v__4082)
        }
      };
      var merge2__4085 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__4083, function() {
          var or__3693__auto____4084 = m1;
          if(cljs.core.truth_(or__3693__auto____4084)) {
            return or__3693__auto____4084
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__4085, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__4086) {
    var f = cljs.core.first(arglist__4086);
    var maps = cljs.core.rest(arglist__4086);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__4088 = cljs.core.ObjMap.fromObject([], {});
  var keys__4089 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__4089)) {
      var key__4090 = cljs.core.first.call(null, keys__4089);
      var entry__4091 = cljs.core.get.call(null, map, key__4090, "\ufdd0'user/not-found");
      var G__4092 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__4091, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__4088, key__4090, entry__4091) : ret__4088;
      var G__4093 = cljs.core.next.call(null, keys__4089);
      ret__4088 = G__4092;
      keys__4089 = G__4093;
      continue
    }else {
      return ret__4088
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4094 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4109 = null;
  var G__4109__4110 = function(coll, v) {
    var this__4095 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__4109__4111 = function(coll, v, not_found) {
    var this__4096 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__4096.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__4109 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4109__4110.call(this, coll, v);
      case 3:
        return G__4109__4111.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4109
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__4113 = null;
  var G__4113__4114 = function(coll, k) {
    var this__4097 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k)
  };
  var G__4113__4115 = function(coll, k, not_found) {
    var this__4098 = this;
    coll = this;
    return cljs.core._lookup.call(null, coll, k, not_found)
  };
  G__4113 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4113__4114.call(this, coll, k);
      case 3:
        return G__4113__4115.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4113
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4099 = this;
  return new cljs.core.Set(this__4099.meta, cljs.core.assoc.call(null, this__4099.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4100 = this;
  return cljs.core.keys.call(null, this__4100.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__4101 = this;
  return new cljs.core.Set(this__4101.meta, cljs.core.dissoc.call(null, this__4101.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4102 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4103 = this;
  var and__3691__auto____4104 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3691__auto____4104)) {
    var and__3691__auto____4105 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3691__auto____4105)) {
      return cljs.core.every_QMARK_.call(null, function(p1__4087_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4087_SHARP_)
      }, other)
    }else {
      return and__3691__auto____4105
    }
  }else {
    return and__3691__auto____4104
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4106 = this;
  return new cljs.core.Set(meta, this__4106.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4107 = this;
  return this__4107.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4108 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__4108.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__4118 = cljs.core.seq.call(null, coll);
  var out__4119 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__4118)))) {
      var G__4120 = cljs.core.rest.call(null, in$__4118);
      var G__4121 = cljs.core.conj.call(null, out__4119, cljs.core.first.call(null, in$__4118));
      in$__4118 = G__4120;
      out__4119 = G__4121;
      continue
    }else {
      return out__4119
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__4122 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3840__auto____4123 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3840__auto____4123)) {
        var e__4124 = temp__3840__auto____4123;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__4124))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__4122, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4117_SHARP_) {
      var temp__3840__auto____4125 = cljs.core.find.call(null, smap, p1__4117_SHARP_);
      if(cljs.core.truth_(temp__3840__auto____4125)) {
        var e__4126 = temp__3840__auto____4125;
        return cljs.core.second.call(null, e__4126)
      }else {
        return p1__4117_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__4134 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4127, seen) {
        while(true) {
          var vec__4128__4129 = p__4127;
          var f__4130 = cljs.core.nth.call(null, vec__4128__4129, 0, null);
          var xs__4131 = vec__4128__4129;
          var temp__3843__auto____4132 = cljs.core.seq.call(null, xs__4131);
          if(cljs.core.truth_(temp__3843__auto____4132)) {
            var s__4133 = temp__3843__auto____4132;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__4130))) {
              var G__4135 = cljs.core.rest.call(null, s__4133);
              var G__4136 = seen;
              p__4127 = G__4135;
              seen = G__4136;
              continue
            }else {
              return cljs.core.cons.call(null, f__4130, step.call(null, cljs.core.rest.call(null, s__4133), cljs.core.conj.call(null, seen, f__4130)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__4134.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__4137 = cljs.core.Vector.fromArray([]);
  var s__4138 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__4138))) {
      var G__4139 = cljs.core.conj.call(null, ret__4137, cljs.core.first.call(null, s__4138));
      var G__4140 = cljs.core.next.call(null, s__4138);
      ret__4137 = G__4139;
      s__4138 = G__4140;
      continue
    }else {
      return cljs.core.seq.call(null, ret__4137)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3693__auto____4141 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3693__auto____4141)) {
        return or__3693__auto____4141
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__4142 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__4142 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__4142 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3693__auto____4143 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3693__auto____4143)) {
      return or__3693__auto____4143
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__4144 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__4144 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__4144)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__4147 = cljs.core.ObjMap.fromObject([], {});
  var ks__4148 = cljs.core.seq.call(null, keys);
  var vs__4149 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3691__auto____4150 = ks__4148;
      if(cljs.core.truth_(and__3691__auto____4150)) {
        return vs__4149
      }else {
        return and__3691__auto____4150
      }
    }())) {
      var G__4151 = cljs.core.assoc.call(null, map__4147, cljs.core.first.call(null, ks__4148), cljs.core.first.call(null, vs__4149));
      var G__4152 = cljs.core.next.call(null, ks__4148);
      var G__4153 = cljs.core.next.call(null, vs__4149);
      map__4147 = G__4151;
      ks__4148 = G__4152;
      vs__4149 = G__4153;
      continue
    }else {
      return map__4147
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__4156 = function(k, x) {
    return x
  };
  var max_key__4157 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4158 = function() {
    var G__4160__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4145_SHARP_, p2__4146_SHARP_) {
        return max_key.call(null, k, p1__4145_SHARP_, p2__4146_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4160 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4160__delegate.call(this, k, x, y, more)
    };
    G__4160.cljs$lang$maxFixedArity = 3;
    G__4160.cljs$lang$applyTo = function(arglist__4161) {
      var k = cljs.core.first(arglist__4161);
      var x = cljs.core.first(cljs.core.next(arglist__4161));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4161)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4161)));
      return G__4160__delegate.call(this, k, x, y, more)
    };
    return G__4160
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__4156.call(this, k, x);
      case 3:
        return max_key__4157.call(this, k, x, y);
      default:
        return max_key__4158.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4158.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__4162 = function(k, x) {
    return x
  };
  var min_key__4163 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4164 = function() {
    var G__4166__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4154_SHARP_, p2__4155_SHARP_) {
        return min_key.call(null, k, p1__4154_SHARP_, p2__4155_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4166 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4166__delegate.call(this, k, x, y, more)
    };
    G__4166.cljs$lang$maxFixedArity = 3;
    G__4166.cljs$lang$applyTo = function(arglist__4167) {
      var k = cljs.core.first(arglist__4167);
      var x = cljs.core.first(cljs.core.next(arglist__4167));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4167)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4167)));
      return G__4166__delegate.call(this, k, x, y, more)
    };
    return G__4166
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__4162.call(this, k, x);
      case 3:
        return min_key__4163.call(this, k, x, y);
      default:
        return min_key__4164.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4164.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__4170 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__4171 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____4168 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____4168)) {
        var s__4169 = temp__3843__auto____4168;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__4169), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__4169)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__4170.call(this, n, step);
      case 3:
        return partition_all__4171.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3843__auto____4173 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3843__auto____4173)) {
      var s__4174 = temp__3843__auto____4173;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__4174)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4174), take_while.call(null, pred, cljs.core.rest.call(null, s__4174)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__4175 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__4176 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4192 = null;
  var G__4192__4193 = function(rng, f) {
    var this__4177 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__4192__4194 = function(rng, f, s) {
    var this__4178 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__4192 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__4192__4193.call(this, rng, f);
      case 3:
        return G__4192__4194.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4192
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__4179 = this;
  var comp__4180 = cljs.core.truth_(this__4179.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__4180.call(null, this__4179.start, this__4179.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__4181 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__4181.end - this__4181.start) / this__4181.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__4182 = this;
  return this__4182.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__4183 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__4183.meta, this__4183.start + this__4183.step, this__4183.end, this__4183.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__4184 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__4185 = this;
  return new cljs.core.Range(meta, this__4185.start, this__4185.end, this__4185.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__4186 = this;
  return this__4186.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4196 = null;
  var G__4196__4197 = function(rng, n) {
    var this__4187 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4187.start + n * this__4187.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3691__auto____4188 = this__4187.start > this__4187.end;
        if(cljs.core.truth_(and__3691__auto____4188)) {
          return cljs.core._EQ_.call(null, this__4187.step, 0)
        }else {
          return and__3691__auto____4188
        }
      }())) {
        return this__4187.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__4196__4198 = function(rng, n, not_found) {
    var this__4189 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4189.start + n * this__4189.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3691__auto____4190 = this__4189.start > this__4189.end;
        if(cljs.core.truth_(and__3691__auto____4190)) {
          return cljs.core._EQ_.call(null, this__4189.step, 0)
        }else {
          return and__3691__auto____4190
        }
      }())) {
        return this__4189.start
      }else {
        return not_found
      }
    }
  };
  G__4196 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4196__4197.call(this, rng, n);
      case 3:
        return G__4196__4198.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4196
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__4191 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4191.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__4200 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__4201 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__4202 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__4203 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__4200.call(this);
      case 1:
        return range__4201.call(this, start);
      case 2:
        return range__4202.call(this, start, end);
      case 3:
        return range__4203.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3843__auto____4205 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3843__auto____4205)) {
      var s__4206 = temp__3843__auto____4205;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__4206), take_nth.call(null, n, cljs.core.drop.call(null, n, s__4206)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3843__auto____4208 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3843__auto____4208)) {
      var s__4209 = temp__3843__auto____4208;
      var fst__4210 = cljs.core.first.call(null, s__4209);
      var fv__4211 = f.call(null, fst__4210);
      var run__4212 = cljs.core.cons.call(null, fst__4210, cljs.core.take_while.call(null, function(p1__4207_SHARP_) {
        return cljs.core._EQ_.call(null, fv__4211, f.call(null, p1__4207_SHARP_))
      }, cljs.core.next.call(null, s__4209)));
      return cljs.core.cons.call(null, run__4212, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__4212), s__4209))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__4227 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3840__auto____4223 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3840__auto____4223)) {
        var s__4224 = temp__3840__auto____4223;
        return reductions.call(null, f, cljs.core.first.call(null, s__4224), cljs.core.rest.call(null, s__4224))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__4228 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3843__auto____4225 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3843__auto____4225)) {
        var s__4226 = temp__3843__auto____4225;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__4226)), cljs.core.rest.call(null, s__4226))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__4227.call(this, f, init);
      case 3:
        return reductions__4228.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__4231 = function(f) {
    return function() {
      var G__4236 = null;
      var G__4236__4237 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4236__4238 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4236__4239 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4236__4240 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4236__4241 = function() {
        var G__4243__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4243 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4243__delegate.call(this, x, y, z, args)
        };
        G__4243.cljs$lang$maxFixedArity = 3;
        G__4243.cljs$lang$applyTo = function(arglist__4244) {
          var x = cljs.core.first(arglist__4244);
          var y = cljs.core.first(cljs.core.next(arglist__4244));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4244)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4244)));
          return G__4243__delegate.call(this, x, y, z, args)
        };
        return G__4243
      }();
      G__4236 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4236__4237.call(this);
          case 1:
            return G__4236__4238.call(this, x);
          case 2:
            return G__4236__4239.call(this, x, y);
          case 3:
            return G__4236__4240.call(this, x, y, z);
          default:
            return G__4236__4241.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4236.cljs$lang$maxFixedArity = 3;
      G__4236.cljs$lang$applyTo = G__4236__4241.cljs$lang$applyTo;
      return G__4236
    }()
  };
  var juxt__4232 = function(f, g) {
    return function() {
      var G__4245 = null;
      var G__4245__4246 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4245__4247 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4245__4248 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4245__4249 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4245__4250 = function() {
        var G__4252__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4252 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4252__delegate.call(this, x, y, z, args)
        };
        G__4252.cljs$lang$maxFixedArity = 3;
        G__4252.cljs$lang$applyTo = function(arglist__4253) {
          var x = cljs.core.first(arglist__4253);
          var y = cljs.core.first(cljs.core.next(arglist__4253));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4253)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4253)));
          return G__4252__delegate.call(this, x, y, z, args)
        };
        return G__4252
      }();
      G__4245 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4245__4246.call(this);
          case 1:
            return G__4245__4247.call(this, x);
          case 2:
            return G__4245__4248.call(this, x, y);
          case 3:
            return G__4245__4249.call(this, x, y, z);
          default:
            return G__4245__4250.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4245.cljs$lang$maxFixedArity = 3;
      G__4245.cljs$lang$applyTo = G__4245__4250.cljs$lang$applyTo;
      return G__4245
    }()
  };
  var juxt__4233 = function(f, g, h) {
    return function() {
      var G__4254 = null;
      var G__4254__4255 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4254__4256 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4254__4257 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4254__4258 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4254__4259 = function() {
        var G__4261__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4261 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4261__delegate.call(this, x, y, z, args)
        };
        G__4261.cljs$lang$maxFixedArity = 3;
        G__4261.cljs$lang$applyTo = function(arglist__4262) {
          var x = cljs.core.first(arglist__4262);
          var y = cljs.core.first(cljs.core.next(arglist__4262));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4262)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4262)));
          return G__4261__delegate.call(this, x, y, z, args)
        };
        return G__4261
      }();
      G__4254 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4254__4255.call(this);
          case 1:
            return G__4254__4256.call(this, x);
          case 2:
            return G__4254__4257.call(this, x, y);
          case 3:
            return G__4254__4258.call(this, x, y, z);
          default:
            return G__4254__4259.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4254.cljs$lang$maxFixedArity = 3;
      G__4254.cljs$lang$applyTo = G__4254__4259.cljs$lang$applyTo;
      return G__4254
    }()
  };
  var juxt__4234 = function() {
    var G__4263__delegate = function(f, g, h, fs) {
      var fs__4230 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4264 = null;
        var G__4264__4265 = function() {
          return cljs.core.reduce.call(null, function(p1__4213_SHARP_, p2__4214_SHARP_) {
            return cljs.core.conj.call(null, p1__4213_SHARP_, p2__4214_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__4230)
        };
        var G__4264__4266 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4215_SHARP_, p2__4216_SHARP_) {
            return cljs.core.conj.call(null, p1__4215_SHARP_, p2__4216_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__4230)
        };
        var G__4264__4267 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4217_SHARP_, p2__4218_SHARP_) {
            return cljs.core.conj.call(null, p1__4217_SHARP_, p2__4218_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__4230)
        };
        var G__4264__4268 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4219_SHARP_, p2__4220_SHARP_) {
            return cljs.core.conj.call(null, p1__4219_SHARP_, p2__4220_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__4230)
        };
        var G__4264__4269 = function() {
          var G__4271__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4221_SHARP_, p2__4222_SHARP_) {
              return cljs.core.conj.call(null, p1__4221_SHARP_, cljs.core.apply.call(null, p2__4222_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__4230)
          };
          var G__4271 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4271__delegate.call(this, x, y, z, args)
          };
          G__4271.cljs$lang$maxFixedArity = 3;
          G__4271.cljs$lang$applyTo = function(arglist__4272) {
            var x = cljs.core.first(arglist__4272);
            var y = cljs.core.first(cljs.core.next(arglist__4272));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4272)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4272)));
            return G__4271__delegate.call(this, x, y, z, args)
          };
          return G__4271
        }();
        G__4264 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4264__4265.call(this);
            case 1:
              return G__4264__4266.call(this, x);
            case 2:
              return G__4264__4267.call(this, x, y);
            case 3:
              return G__4264__4268.call(this, x, y, z);
            default:
              return G__4264__4269.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__4264.cljs$lang$maxFixedArity = 3;
        G__4264.cljs$lang$applyTo = G__4264__4269.cljs$lang$applyTo;
        return G__4264
      }()
    };
    var G__4263 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4263__delegate.call(this, f, g, h, fs)
    };
    G__4263.cljs$lang$maxFixedArity = 3;
    G__4263.cljs$lang$applyTo = function(arglist__4273) {
      var f = cljs.core.first(arglist__4273);
      var g = cljs.core.first(cljs.core.next(arglist__4273));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4273)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4273)));
      return G__4263__delegate.call(this, f, g, h, fs)
    };
    return G__4263
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__4231.call(this, f);
      case 2:
        return juxt__4232.call(this, f, g);
      case 3:
        return juxt__4233.call(this, f, g, h);
      default:
        return juxt__4234.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4234.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__4275 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__4278 = cljs.core.next.call(null, coll);
        coll = G__4278;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__4276 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3691__auto____4274 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3691__auto____4274)) {
          return n > 0
        }else {
          return and__3691__auto____4274
        }
      }())) {
        var G__4279 = n - 1;
        var G__4280 = cljs.core.next.call(null, coll);
        n = G__4279;
        coll = G__4280;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__4275.call(this, n);
      case 2:
        return dorun__4276.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__4281 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__4282 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__4281.call(this, n);
      case 2:
        return doall__4282.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__4284 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__4284), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4284), 1))) {
      return cljs.core.first.call(null, matches__4284)
    }else {
      return cljs.core.vec.call(null, matches__4284)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__4285 = re.exec(s);
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, matches__4285))) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4285), 1))) {
      return cljs.core.first.call(null, matches__4285)
    }else {
      return cljs.core.vec.call(null, matches__4285)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__4286 = cljs.core.re_find.call(null, re, s);
  var match_idx__4287 = s.search(re);
  var match_str__4288 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__4286)) ? cljs.core.first.call(null, match_data__4286) : match_data__4286;
  var post_match__4289 = cljs.core.subs.call(null, s, match_idx__4287 + cljs.core.count.call(null, match_str__4288));
  if(cljs.core.truth_(match_data__4286)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__4286, re_seq.call(null, re, post_match__4289))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  return new RegExp(s)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__4290_SHARP_) {
    return print_one.call(null, p1__4290_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3691__auto____4291 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3691__auto____4291)) {
            var and__3691__auto____4295 = function() {
              var x__418__auto____4292 = obj;
              if(cljs.core.truth_(function() {
                var and__3691__auto____4293 = x__418__auto____4292;
                if(cljs.core.truth_(and__3691__auto____4293)) {
                  var and__3691__auto____4294 = x__418__auto____4292.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3691__auto____4294)) {
                    return cljs.core.not.call(null, x__418__auto____4292.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3691__auto____4294
                  }
                }else {
                  return and__3691__auto____4293
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__418__auto____4292)
              }
            }();
            if(cljs.core.truth_(and__3691__auto____4295)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3691__auto____4295
            }
          }else {
            return and__3691__auto____4291
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__418__auto____4296 = obj;
          if(cljs.core.truth_(function() {
            var and__3691__auto____4297 = x__418__auto____4296;
            if(cljs.core.truth_(and__3691__auto____4297)) {
              var and__3691__auto____4298 = x__418__auto____4296.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3691__auto____4298)) {
                return cljs.core.not.call(null, x__418__auto____4296.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3691__auto____4298
              }
            }else {
              return and__3691__auto____4297
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__418__auto____4296)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__4299 = cljs.core.first.call(null, objs);
  var sb__4300 = new goog.string.StringBuffer;
  var G__4301__4302 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4301__4302)) {
    var obj__4303 = cljs.core.first.call(null, G__4301__4302);
    var G__4301__4304 = G__4301__4302;
    while(true) {
      if(cljs.core.truth_(obj__4303 === first_obj__4299)) {
      }else {
        sb__4300.append(" ")
      }
      var G__4305__4306 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4303, opts));
      if(cljs.core.truth_(G__4305__4306)) {
        var string__4307 = cljs.core.first.call(null, G__4305__4306);
        var G__4305__4308 = G__4305__4306;
        while(true) {
          sb__4300.append(string__4307);
          var temp__3843__auto____4309 = cljs.core.next.call(null, G__4305__4308);
          if(cljs.core.truth_(temp__3843__auto____4309)) {
            var G__4305__4310 = temp__3843__auto____4309;
            var G__4313 = cljs.core.first.call(null, G__4305__4310);
            var G__4314 = G__4305__4310;
            string__4307 = G__4313;
            G__4305__4308 = G__4314;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3843__auto____4311 = cljs.core.next.call(null, G__4301__4304);
      if(cljs.core.truth_(temp__3843__auto____4311)) {
        var G__4301__4312 = temp__3843__auto____4311;
        var G__4315 = cljs.core.first.call(null, G__4301__4312);
        var G__4316 = G__4301__4312;
        obj__4303 = G__4315;
        G__4301__4304 = G__4316;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__4300)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__4317 = cljs.core.first.call(null, objs);
  var G__4318__4319 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4318__4319)) {
    var obj__4320 = cljs.core.first.call(null, G__4318__4319);
    var G__4318__4321 = G__4318__4319;
    while(true) {
      if(cljs.core.truth_(obj__4320 === first_obj__4317)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__4322__4323 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4320, opts));
      if(cljs.core.truth_(G__4322__4323)) {
        var string__4324 = cljs.core.first.call(null, G__4322__4323);
        var G__4322__4325 = G__4322__4323;
        while(true) {
          cljs.core.string_print.call(null, string__4324);
          var temp__3843__auto____4326 = cljs.core.next.call(null, G__4322__4325);
          if(cljs.core.truth_(temp__3843__auto____4326)) {
            var G__4322__4327 = temp__3843__auto____4326;
            var G__4330 = cljs.core.first.call(null, G__4322__4327);
            var G__4331 = G__4322__4327;
            string__4324 = G__4330;
            G__4322__4325 = G__4331;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3843__auto____4328 = cljs.core.next.call(null, G__4318__4321);
      if(cljs.core.truth_(temp__3843__auto____4328)) {
        var G__4318__4329 = temp__3843__auto____4328;
        var G__4332 = cljs.core.first.call(null, G__4318__4329);
        var G__4333 = G__4318__4329;
        obj__4320 = G__4332;
        G__4318__4321 = G__4333;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4334) {
    var objs = cljs.core.seq(arglist__4334);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4335) {
    var objs = cljs.core.seq(arglist__4335);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4336) {
    var objs = cljs.core.seq(arglist__4336);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4337) {
    var objs = cljs.core.seq(arglist__4337);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4338) {
    var objs = cljs.core.seq(arglist__4338);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4339 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4339, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3843__auto____4340 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3843__auto____4340)) {
        var nspc__4341 = temp__3843__auto____4340;
        return cljs.core.str.call(null, nspc__4341, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3843__auto____4342 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3843__auto____4342)) {
          var nspc__4343 = temp__3843__auto____4342;
          return cljs.core.str.call(null, nspc__4343, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4344 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4344, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4345 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__4346 = this;
  var G__4347__4348 = cljs.core.seq.call(null, this__4346.watches);
  if(cljs.core.truth_(G__4347__4348)) {
    var G__4350__4352 = cljs.core.first.call(null, G__4347__4348);
    var vec__4351__4353 = G__4350__4352;
    var key__4354 = cljs.core.nth.call(null, vec__4351__4353, 0, null);
    var f__4355 = cljs.core.nth.call(null, vec__4351__4353, 1, null);
    var G__4347__4356 = G__4347__4348;
    var G__4350__4357 = G__4350__4352;
    var G__4347__4358 = G__4347__4356;
    while(true) {
      var vec__4359__4360 = G__4350__4357;
      var key__4361 = cljs.core.nth.call(null, vec__4359__4360, 0, null);
      var f__4362 = cljs.core.nth.call(null, vec__4359__4360, 1, null);
      var G__4347__4363 = G__4347__4358;
      f__4362.call(null, key__4361, this$, oldval, newval);
      var temp__3843__auto____4364 = cljs.core.next.call(null, G__4347__4363);
      if(cljs.core.truth_(temp__3843__auto____4364)) {
        var G__4347__4365 = temp__3843__auto____4364;
        var G__4372 = cljs.core.first.call(null, G__4347__4365);
        var G__4373 = G__4347__4365;
        G__4350__4357 = G__4372;
        G__4347__4358 = G__4373;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__4366 = this;
  return this$.watches = cljs.core.assoc.call(null, this__4366.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__4367 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__4367.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__4368 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__4368.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__4369 = this;
  return this__4369.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4370 = this;
  return this__4370.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4371 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__4380 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__4381 = function() {
    var G__4383__delegate = function(x, p__4374) {
      var map__4375__4376 = p__4374;
      var map__4375__4377 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4375__4376)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4375__4376) : map__4375__4376;
      var validator__4378 = cljs.core.get.call(null, map__4375__4377, "\ufdd0'validator");
      var meta__4379 = cljs.core.get.call(null, map__4375__4377, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__4379, validator__4378, null)
    };
    var G__4383 = function(x, var_args) {
      var p__4374 = null;
      if(goog.isDef(var_args)) {
        p__4374 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4383__delegate.call(this, x, p__4374)
    };
    G__4383.cljs$lang$maxFixedArity = 1;
    G__4383.cljs$lang$applyTo = function(arglist__4384) {
      var x = cljs.core.first(arglist__4384);
      var p__4374 = cljs.core.rest(arglist__4384);
      return G__4383__delegate.call(this, x, p__4374)
    };
    return G__4383
  }();
  atom = function(x, var_args) {
    var p__4374 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__4380.call(this, x);
      default:
        return atom__4381.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__4381.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3843__auto____4385 = a.validator;
  if(cljs.core.truth_(temp__3843__auto____4385)) {
    var validate__4386 = temp__3843__auto____4385;
    if(cljs.core.truth_(validate__4386.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3061)))));
    }
  }else {
  }
  var old_value__4387 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__4387, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___4388 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___4389 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4390 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___4391 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___4392 = function() {
    var G__4394__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4394 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4394__delegate.call(this, a, f, x, y, z, more)
    };
    G__4394.cljs$lang$maxFixedArity = 5;
    G__4394.cljs$lang$applyTo = function(arglist__4395) {
      var a = cljs.core.first(arglist__4395);
      var f = cljs.core.first(cljs.core.next(arglist__4395));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4395)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4395))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4395)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4395)))));
      return G__4394__delegate.call(this, a, f, x, y, z, more)
    };
    return G__4394
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___4388.call(this, a, f);
      case 3:
        return swap_BANG___4389.call(this, a, f, x);
      case 4:
        return swap_BANG___4390.call(this, a, f, x, y);
      case 5:
        return swap_BANG___4391.call(this, a, f, x, y, z);
      default:
        return swap_BANG___4392.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___4392.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4396) {
    var iref = cljs.core.first(arglist__4396);
    var f = cljs.core.first(cljs.core.next(arglist__4396));
    var args = cljs.core.rest(cljs.core.next(arglist__4396));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__4397 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__4398 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, cljs.core.gensym_counter))) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__4397.call(this);
      case 1:
        return gensym__4398.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__4400 = this;
  return cljs.core.not.call(null, cljs.core.nil_QMARK_.call(null, cljs.core.deref.call(null, this__4400.state)))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4401 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__4401.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__4401.state, this__4401.f)
  }
  return cljs.core.deref.call(null, this__4401.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__4402) {
    var body = cljs.core.seq(arglist__4402);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__4403__4404 = options;
    var map__4403__4405 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4403__4404)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4403__4404) : map__4403__4404;
    var keywordize_keys__4406 = cljs.core.get.call(null, map__4403__4405, "\ufdd0'keywordize-keys");
    var keyfn__4407 = cljs.core.truth_(keywordize_keys__4406) ? cljs.core.keyword : cljs.core.str;
    var f__4413 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__482__auto____4412 = function iter__4408(s__4409) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__4409__4410 = s__4409;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__4409__4410))) {
                        var k__4411 = cljs.core.first.call(null, s__4409__4410);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__4407.call(null, k__4411), thisfn.call(null, x[k__4411])]), iter__4408.call(null, cljs.core.rest.call(null, s__4409__4410)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__482__auto____4412.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__4413.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__4414) {
    var x = cljs.core.first(arglist__4414);
    var options = cljs.core.rest(arglist__4414);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__4415 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__4419__delegate = function(args) {
      var temp__3840__auto____4416 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__4415), args);
      if(cljs.core.truth_(temp__3840__auto____4416)) {
        var v__4417 = temp__3840__auto____4416;
        return v__4417
      }else {
        var ret__4418 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__4415, cljs.core.assoc, args, ret__4418);
        return ret__4418
      }
    };
    var G__4419 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4419__delegate.call(this, args)
    };
    G__4419.cljs$lang$maxFixedArity = 0;
    G__4419.cljs$lang$applyTo = function(arglist__4420) {
      var args = cljs.core.seq(arglist__4420);
      return G__4419__delegate.call(this, args)
    };
    return G__4419
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__4422 = function(f) {
    while(true) {
      var ret__4421 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__4421))) {
        var G__4425 = ret__4421;
        f = G__4425;
        continue
      }else {
        return ret__4421
      }
      break
    }
  };
  var trampoline__4423 = function() {
    var G__4426__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4426 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4426__delegate.call(this, f, args)
    };
    G__4426.cljs$lang$maxFixedArity = 1;
    G__4426.cljs$lang$applyTo = function(arglist__4427) {
      var f = cljs.core.first(arglist__4427);
      var args = cljs.core.rest(arglist__4427);
      return G__4426__delegate.call(this, f, args)
    };
    return G__4426
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__4422.call(this, f);
      default:
        return trampoline__4423.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__4423.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__4428 = function() {
    return rand.call(null, 1)
  };
  var rand__4429 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__4428.call(this);
      case 1:
        return rand__4429.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__4431 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__4431, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__4431, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___4440 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___4441 = function(h, child, parent) {
    var or__3693__auto____4432 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3693__auto____4432)) {
      return or__3693__auto____4432
    }else {
      var or__3693__auto____4433 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3693__auto____4433)) {
        return or__3693__auto____4433
      }else {
        var and__3691__auto____4434 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3691__auto____4434)) {
          var and__3691__auto____4435 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3691__auto____4435)) {
            var and__3691__auto____4436 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3691__auto____4436)) {
              var ret__4437 = true;
              var i__4438 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3693__auto____4439 = cljs.core.not.call(null, ret__4437);
                  if(cljs.core.truth_(or__3693__auto____4439)) {
                    return or__3693__auto____4439
                  }else {
                    return cljs.core._EQ_.call(null, i__4438, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__4437
                }else {
                  var G__4443 = isa_QMARK_.call(null, h, child.call(null, i__4438), parent.call(null, i__4438));
                  var G__4444 = i__4438 + 1;
                  ret__4437 = G__4443;
                  i__4438 = G__4444;
                  continue
                }
                break
              }
            }else {
              return and__3691__auto____4436
            }
          }else {
            return and__3691__auto____4435
          }
        }else {
          return and__3691__auto____4434
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___4440.call(this, h, child);
      case 3:
        return isa_QMARK___4441.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__4445 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__4446 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__4445.call(this, h);
      case 2:
        return parents__4446.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__4448 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__4449 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__4448.call(this, h);
      case 2:
        return ancestors__4449.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__4451 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__4452 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__4451.call(this, h);
      case 2:
        return descendants__4452.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__4462 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3353)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__4463 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3357)))));
    }
    var tp__4457 = "\ufdd0'parents".call(null, h);
    var td__4458 = "\ufdd0'descendants".call(null, h);
    var ta__4459 = "\ufdd0'ancestors".call(null, h);
    var tf__4460 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3693__auto____4461 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__4457.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4459.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4459.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__4457, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__4460.call(null, "\ufdd0'ancestors".call(null, h), tag, td__4458, parent, ta__4459), "\ufdd0'descendants":tf__4460.call(null, "\ufdd0'descendants".call(null, h), parent, ta__4459, tag, td__4458)})
    }();
    if(cljs.core.truth_(or__3693__auto____4461)) {
      return or__3693__auto____4461
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__4462.call(this, h, tag);
      case 3:
        return derive__4463.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__4469 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__4470 = function(h, tag, parent) {
    var parentMap__4465 = "\ufdd0'parents".call(null, h);
    var childsParents__4466 = cljs.core.truth_(parentMap__4465.call(null, tag)) ? cljs.core.disj.call(null, parentMap__4465.call(null, tag), parent) : cljs.core.set([]);
    var newParents__4467 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__4466)) ? cljs.core.assoc.call(null, parentMap__4465, tag, childsParents__4466) : cljs.core.dissoc.call(null, parentMap__4465, tag);
    var deriv_seq__4468 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__4454_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4454_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4454_SHARP_), cljs.core.second.call(null, p1__4454_SHARP_)))
    }, cljs.core.seq.call(null, newParents__4467)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__4465.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__4455_SHARP_, p2__4456_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4455_SHARP_, p2__4456_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__4468))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__4469.call(this, h, tag);
      case 3:
        return underive__4470.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__4472 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3693__auto____4474 = cljs.core.truth_(function() {
    var and__3691__auto____4473 = xprefs__4472;
    if(cljs.core.truth_(and__3691__auto____4473)) {
      return xprefs__4472.call(null, y)
    }else {
      return and__3691__auto____4473
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3693__auto____4474)) {
    return or__3693__auto____4474
  }else {
    var or__3693__auto____4476 = function() {
      var ps__4475 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__4475) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__4475), prefer_table))) {
          }else {
          }
          var G__4479 = cljs.core.rest.call(null, ps__4475);
          ps__4475 = G__4479;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3693__auto____4476)) {
      return or__3693__auto____4476
    }else {
      var or__3693__auto____4478 = function() {
        var ps__4477 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__4477) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__4477), y, prefer_table))) {
            }else {
            }
            var G__4480 = cljs.core.rest.call(null, ps__4477);
            ps__4477 = G__4480;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3693__auto____4478)) {
        return or__3693__auto____4478
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3693__auto____4481 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3693__auto____4481)) {
    return or__3693__auto____4481
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__4490 = cljs.core.reduce.call(null, function(be, p__4482) {
    var vec__4483__4484 = p__4482;
    var k__4485 = cljs.core.nth.call(null, vec__4483__4484, 0, null);
    var ___4486 = cljs.core.nth.call(null, vec__4483__4484, 1, null);
    var e__4487 = vec__4483__4484;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__4485))) {
      var be2__4489 = cljs.core.truth_(function() {
        var or__3693__auto____4488 = cljs.core.nil_QMARK_.call(null, be);
        if(cljs.core.truth_(or__3693__auto____4488)) {
          return or__3693__auto____4488
        }else {
          return cljs.core.dominates.call(null, k__4485, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__4487 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__4489), k__4485, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__4485, " and ", cljs.core.first.call(null, be2__4489), ", and neither is preferred"));
      }
      return be2__4489
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__4490)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__4490));
      return cljs.core.second.call(null, best_entry__4490)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4491 = mf;
    if(cljs.core.truth_(and__3691__auto____4491)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3691__auto____4491
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3693__auto____4492 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4492)) {
        return or__3693__auto____4492
      }else {
        var or__3693__auto____4493 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3693__auto____4493)) {
          return or__3693__auto____4493
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4494 = mf;
    if(cljs.core.truth_(and__3691__auto____4494)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3691__auto____4494
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3693__auto____4495 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4495)) {
        return or__3693__auto____4495
      }else {
        var or__3693__auto____4496 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3693__auto____4496)) {
          return or__3693__auto____4496
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4497 = mf;
    if(cljs.core.truth_(and__3691__auto____4497)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3691__auto____4497
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3693__auto____4498 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4498)) {
        return or__3693__auto____4498
      }else {
        var or__3693__auto____4499 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3693__auto____4499)) {
          return or__3693__auto____4499
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4500 = mf;
    if(cljs.core.truth_(and__3691__auto____4500)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3691__auto____4500
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3693__auto____4501 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4501)) {
        return or__3693__auto____4501
      }else {
        var or__3693__auto____4502 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3693__auto____4502)) {
          return or__3693__auto____4502
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4503 = mf;
    if(cljs.core.truth_(and__3691__auto____4503)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3691__auto____4503
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3693__auto____4504 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4504)) {
        return or__3693__auto____4504
      }else {
        var or__3693__auto____4505 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3693__auto____4505)) {
          return or__3693__auto____4505
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4506 = mf;
    if(cljs.core.truth_(and__3691__auto____4506)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3691__auto____4506
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3693__auto____4507 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4507)) {
        return or__3693__auto____4507
      }else {
        var or__3693__auto____4508 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3693__auto____4508)) {
          return or__3693__auto____4508
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4509 = mf;
    if(cljs.core.truth_(and__3691__auto____4509)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3691__auto____4509
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3693__auto____4510 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4510)) {
        return or__3693__auto____4510
      }else {
        var or__3693__auto____4511 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3693__auto____4511)) {
          return or__3693__auto____4511
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4512 = mf;
    if(cljs.core.truth_(and__3691__auto____4512)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3691__auto____4512
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3693__auto____4513 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3693__auto____4513)) {
        return or__3693__auto____4513
      }else {
        var or__3693__auto____4514 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3693__auto____4514)) {
          return or__3693__auto____4514
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__4515 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__4516 = cljs.core._get_method.call(null, mf, dispatch_val__4515);
  if(cljs.core.truth_(target_fn__4516)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__4515));
  }
  return cljs.core.apply.call(null, target_fn__4516, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4517 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__4518 = this;
  cljs.core.swap_BANG_.call(null, this__4518.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4518.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4518.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4518.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__4519 = this;
  cljs.core.swap_BANG_.call(null, this__4519.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__4519.method_cache, this__4519.method_table, this__4519.cached_hierarchy, this__4519.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__4520 = this;
  cljs.core.swap_BANG_.call(null, this__4520.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__4520.method_cache, this__4520.method_table, this__4520.cached_hierarchy, this__4520.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__4521 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__4521.cached_hierarchy), cljs.core.deref.call(null, this__4521.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__4521.method_cache, this__4521.method_table, this__4521.cached_hierarchy, this__4521.hierarchy)
  }
  var temp__3840__auto____4522 = cljs.core.deref.call(null, this__4521.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3840__auto____4522)) {
    var target_fn__4523 = temp__3840__auto____4522;
    return target_fn__4523
  }else {
    var temp__3840__auto____4524 = cljs.core.find_and_cache_best_method.call(null, this__4521.name, dispatch_val, this__4521.hierarchy, this__4521.method_table, this__4521.prefer_table, this__4521.method_cache, this__4521.cached_hierarchy);
    if(cljs.core.truth_(temp__3840__auto____4524)) {
      var target_fn__4525 = temp__3840__auto____4524;
      return target_fn__4525
    }else {
      return cljs.core.deref.call(null, this__4521.method_table).call(null, this__4521.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__4526 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__4526.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__4526.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__4526.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__4526.method_cache, this__4526.method_table, this__4526.cached_hierarchy, this__4526.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__4527 = this;
  return cljs.core.deref.call(null, this__4527.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__4528 = this;
  return cljs.core.deref.call(null, this__4528.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__4529 = this;
  return cljs.core.do_dispatch.call(null, mf, this__4529.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__4530__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__4530 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__4530__delegate.call(this, _, args)
  };
  G__4530.cljs$lang$maxFixedArity = 1;
  G__4530.cljs$lang$applyTo = function(arglist__4531) {
    var _ = cljs.core.first(arglist__4531);
    var args = cljs.core.rest(arglist__4531);
    return G__4530__delegate.call(this, _, args)
  };
  return G__4530
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("domina");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.dom.xml");
goog.require("goog.dom.classes");
goog.require("goog.dom.forms");
goog.require("goog.style");
goog.require("goog.string");
goog.require("cljs.core");
domina.debug = true;
domina.log_debug = function log_debug(mesg) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4532 = domina.debug;
    if(cljs.core.truth_(and__3691__auto____4532)) {
      return cljs.core.not.call(null, cljs.core._EQ_.call(null, window.console, undefined))
    }else {
      return and__3691__auto____4532
    }
  }())) {
    return console.log(mesg)
  }else {
    return null
  }
};
domina.DomContent = {};
domina.nodes = function nodes(content) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4533 = content;
    if(cljs.core.truth_(and__3691__auto____4533)) {
      return content.domina$DomContent$nodes
    }else {
      return and__3691__auto____4533
    }
  }())) {
    return content.domina$DomContent$nodes(content)
  }else {
    return function() {
      var or__3693__auto____4534 = domina.nodes[goog.typeOf.call(null, content)];
      if(cljs.core.truth_(or__3693__auto____4534)) {
        return or__3693__auto____4534
      }else {
        var or__3693__auto____4535 = domina.nodes["_"];
        if(cljs.core.truth_(or__3693__auto____4535)) {
          return or__3693__auto____4535
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4536 = nodeseq;
    if(cljs.core.truth_(and__3691__auto____4536)) {
      return nodeseq.domina$DomContent$single_node
    }else {
      return and__3691__auto____4536
    }
  }())) {
    return nodeseq.domina$DomContent$single_node(nodeseq)
  }else {
    return function() {
      var or__3693__auto____4537 = domina.single_node[goog.typeOf.call(null, nodeseq)];
      if(cljs.core.truth_(or__3693__auto____4537)) {
        return or__3693__auto____4537
      }else {
        var or__3693__auto____4538 = domina.single_node["_"];
        if(cljs.core.truth_(or__3693__auto____4538)) {
          return or__3693__auto____4538
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.single-node", nodeseq);
        }
      }
    }().call(null, nodeseq)
  }
};
domina.by_id = function by_id(id) {
  return goog.dom.getElement.call(null, cljs.core.name.call(null, id))
};
domina.by_class = function by_class(class_name) {
  if(cljs.core.truth_(void 0 === domina.t4539)) {
    domina.t4539 = function(class_name, by_class, __meta) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.__meta = __meta
    };
    domina.t4539.cljs$core$IPrintable$_pr_seq = function(this__333__auto__) {
      return cljs.core.list.call(null, "domina.t4539")
    };
    domina.t4539.prototype.domina$DomContent$ = true;
    domina.t4539.prototype.domina$DomContent$nodes = function(_) {
      var this__4540 = this;
      return goog.dom.getElementsByClass.call(null, cljs.core.name.call(null, this__4540.class_name))
    };
    domina.t4539.prototype.domina$DomContent$single_node = function(_) {
      var this__4541 = this;
      return goog.dom.getElementByClass.call(null, cljs.core.name.call(null, this__4541.class_name))
    };
    domina.t4539.prototype.cljs$core$IMeta$ = true;
    domina.t4539.prototype.cljs$core$IMeta$_meta = function(_) {
      var this__4542 = this;
      return this__4542.__meta
    };
    domina.t4539.prototype.cljs$core$IWithMeta$ = true;
    domina.t4539.prototype.cljs$core$IWithMeta$_with_meta = function(_, __meta) {
      var this__4543 = this;
      return new domina.t4539(this__4543.class_name, this__4543.by_class, __meta)
    };
    domina.t4539
  }else {
  }
  return new domina.t4539(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__4544_SHARP_) {
    return p1__4544_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__4545_SHARP_, p2__4546_SHARP_) {
    return goog.dom.insertChildAt.call(null, p1__4545_SHARP_, p2__4546_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__4548_SHARP_, p2__4547_SHARP_) {
    return goog.dom.insertSiblingBefore.call(null, p2__4547_SHARP_, p1__4548_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__4550_SHARP_, p2__4549_SHARP_) {
    return goog.dom.insertSiblingAfter.call(null, p2__4549_SHARP_, p1__4550_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__4552_SHARP_, p2__4551_SHARP_) {
    return goog.dom.replaceNode.call(null, p2__4551_SHARP_, p1__4552_SHARP_)
  }, old_content, new_content);
  return old_content
};
domina.detach_BANG_ = function detach_BANG_(content) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_BANG_ = function destroy_BANG_(content) {
  return cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_children_BANG_ = function destroy_children_BANG_(content) {
  cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeChildren, domina.nodes.call(null, content)));
  return content
};
domina.style = function style(content, name) {
  var s__4553 = goog.style.getStyle.call(null, domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(cljs.core.not.call(null, goog.string.isEmptySafe.call(null, s__4553)))) {
    return s__4553
  }else {
    return null
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function set_style_BANG_(content, name, value) {
  var G__4554__4555 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4554__4555)) {
    var n__4556 = cljs.core.first.call(null, G__4554__4555);
    var G__4554__4557 = G__4554__4555;
    while(true) {
      goog.style.setStyle.call(null, n__4556, cljs.core.name.call(null, name), value);
      var temp__3843__auto____4558 = cljs.core.next.call(null, G__4554__4557);
      if(cljs.core.truth_(temp__3843__auto____4558)) {
        var G__4554__4559 = temp__3843__auto____4558;
        var G__4560 = cljs.core.first.call(null, G__4554__4559);
        var G__4561 = G__4554__4559;
        n__4556 = G__4560;
        G__4554__4557 = G__4561;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attr_BANG_ = function set_attr_BANG_(content, name, value) {
  var G__4562__4563 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4562__4563)) {
    var n__4564 = cljs.core.first.call(null, G__4562__4563);
    var G__4562__4565 = G__4562__4563;
    while(true) {
      n__4564.setAttribute(cljs.core.name.call(null, name), value);
      var temp__3843__auto____4566 = cljs.core.next.call(null, G__4562__4565);
      if(cljs.core.truth_(temp__3843__auto____4566)) {
        var G__4562__4567 = temp__3843__auto____4566;
        var G__4568 = cljs.core.first.call(null, G__4562__4567);
        var G__4569 = G__4562__4567;
        n__4564 = G__4568;
        G__4562__4565 = G__4569;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.parse_style_attributes = function parse_style_attributes(style) {
  return cljs.core.reduce.call(null, function(acc, pair) {
    var vec__4570__4571 = pair.split(/\s*:\s*/);
    var k__4572 = cljs.core.nth.call(null, vec__4570__4571, 0, null);
    var v__4573 = cljs.core.nth.call(null, vec__4570__4571, 1, null);
    if(cljs.core.truth_(function() {
      var and__3691__auto____4574 = k__4572;
      if(cljs.core.truth_(and__3691__auto____4574)) {
        return v__4573
      }else {
        return and__3691__auto____4574
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__4572.toLowerCase()), v__4573)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.fromObject([], {}), style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  return domina.parse_style_attributes.call(null, domina.attr.call(null, content, "style"))
};
domina.attrs = function attrs(content) {
  var node__4576 = domina.single_node.call(null, content);
  var attrs__4577 = node__4576.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.map.call(null, function(p1__4575_SHARP_) {
    var attr__4578 = attrs__4577.item(p1__4575_SHARP_);
    return cljs.core.HashMap.fromArrays([cljs.core.keyword.call(null, attr__4578.nodeName.toLowerCase())], [attr__4578.nodeValue])
  }, cljs.core.range.call(null, attrs__4577.length)))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__4579__4580 = cljs.core.seq.call(null, styles);
  if(cljs.core.truth_(G__4579__4580)) {
    var G__4582__4584 = cljs.core.first.call(null, G__4579__4580);
    var vec__4583__4585 = G__4582__4584;
    var name__4586 = cljs.core.nth.call(null, vec__4583__4585, 0, null);
    var value__4587 = cljs.core.nth.call(null, vec__4583__4585, 1, null);
    var G__4579__4588 = G__4579__4580;
    var G__4582__4589 = G__4582__4584;
    var G__4579__4590 = G__4579__4588;
    while(true) {
      var vec__4591__4592 = G__4582__4589;
      var name__4593 = cljs.core.nth.call(null, vec__4591__4592, 0, null);
      var value__4594 = cljs.core.nth.call(null, vec__4591__4592, 1, null);
      var G__4579__4595 = G__4579__4590;
      domina.set_style_BANG_.call(null, content, name__4593, value__4594);
      var temp__3843__auto____4596 = cljs.core.next.call(null, G__4579__4595);
      if(cljs.core.truth_(temp__3843__auto____4596)) {
        var G__4579__4597 = temp__3843__auto____4596;
        var G__4598 = cljs.core.first.call(null, G__4579__4597);
        var G__4599 = G__4579__4597;
        G__4582__4589 = G__4598;
        G__4579__4590 = G__4599;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attrs_BANG_ = function set_attrs_BANG_(content, attrs) {
  var G__4600__4601 = cljs.core.seq.call(null, attrs);
  if(cljs.core.truth_(G__4600__4601)) {
    var G__4603__4605 = cljs.core.first.call(null, G__4600__4601);
    var vec__4604__4606 = G__4603__4605;
    var name__4607 = cljs.core.nth.call(null, vec__4604__4606, 0, null);
    var value__4608 = cljs.core.nth.call(null, vec__4604__4606, 1, null);
    var G__4600__4609 = G__4600__4601;
    var G__4603__4610 = G__4603__4605;
    var G__4600__4611 = G__4600__4609;
    while(true) {
      var vec__4612__4613 = G__4603__4610;
      var name__4614 = cljs.core.nth.call(null, vec__4612__4613, 0, null);
      var value__4615 = cljs.core.nth.call(null, vec__4612__4613, 1, null);
      var G__4600__4616 = G__4600__4611;
      domina.set_attr_BANG_.call(null, content, name__4614, value__4615);
      var temp__3843__auto____4617 = cljs.core.next.call(null, G__4600__4616);
      if(cljs.core.truth_(temp__3843__auto____4617)) {
        var G__4600__4618 = temp__3843__auto____4617;
        var G__4619 = cljs.core.first.call(null, G__4600__4618);
        var G__4620 = G__4600__4618;
        G__4603__4610 = G__4619;
        G__4600__4611 = G__4620;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.has_class_QMARK_ = function has_class_QMARK_(content, class$) {
  return goog.dom.classes.has.call(null, domina.single_node.call(null, content), class$)
};
domina.add_class_BANG_ = function add_class_BANG_(content, class$) {
  var G__4621__4622 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4621__4622)) {
    var node__4623 = cljs.core.first.call(null, G__4621__4622);
    var G__4621__4624 = G__4621__4622;
    while(true) {
      goog.dom.classes.add.call(null, node__4623, class$);
      var temp__3843__auto____4625 = cljs.core.next.call(null, G__4621__4624);
      if(cljs.core.truth_(temp__3843__auto____4625)) {
        var G__4621__4626 = temp__3843__auto____4625;
        var G__4627 = cljs.core.first.call(null, G__4621__4626);
        var G__4628 = G__4621__4626;
        node__4623 = G__4627;
        G__4621__4624 = G__4628;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.remove_class_BANG_ = function remove_class_BANG_(content, class$) {
  var G__4629__4630 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4629__4630)) {
    var node__4631 = cljs.core.first.call(null, G__4629__4630);
    var G__4629__4632 = G__4629__4630;
    while(true) {
      goog.dom.classes.remove.call(null, node__4631, class$);
      var temp__3843__auto____4633 = cljs.core.next.call(null, G__4629__4632);
      if(cljs.core.truth_(temp__3843__auto____4633)) {
        var G__4629__4634 = temp__3843__auto____4633;
        var G__4635 = cljs.core.first.call(null, G__4629__4634);
        var G__4636 = G__4629__4634;
        node__4631 = G__4635;
        G__4629__4632 = G__4636;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.classes = function classes(content) {
  return cljs.core.seq.call(null, goog.dom.classes.get.call(null, domina.single_node.call(null, content)))
};
domina.text = function() {
  var text = null;
  var text__4637 = function(content) {
    return text.call(null, content, true)
  };
  var text__4638 = function(content, normalize) {
    if(cljs.core.truth_(normalize)) {
      return goog.string.trim.call(null, goog.dom.getTextContent.call(null, domina.single_node.call(null, content)))
    }else {
      return goog.dom.getRawTextContent.call(null, domina.single_node.call(null, content))
    }
  };
  text = function(content, normalize) {
    switch(arguments.length) {
      case 1:
        return text__4637.call(this, content);
      case 2:
        return text__4638.call(this, content, normalize)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return text
}();
domina.set_text_BANG_ = function set_text_BANG_(content, value) {
  var G__4640__4641 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4640__4641)) {
    var node__4642 = cljs.core.first.call(null, G__4640__4641);
    var G__4640__4643 = G__4640__4641;
    while(true) {
      goog.dom.setTextContent.call(null, node__4642, value);
      var temp__3843__auto____4644 = cljs.core.next.call(null, G__4640__4643);
      if(cljs.core.truth_(temp__3843__auto____4644)) {
        var G__4640__4645 = temp__3843__auto____4644;
        var G__4646 = cljs.core.first.call(null, G__4640__4645);
        var G__4647 = G__4640__4645;
        node__4642 = G__4646;
        G__4640__4643 = G__4647;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.value = function value(content) {
  return goog.dom.forms.getValue.call(null, domina.single_node.call(null, content))
};
domina.set_value_BANG_ = function set_value_BANG_(content, value) {
  var G__4648__4649 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4648__4649)) {
    var node__4650 = cljs.core.first.call(null, G__4648__4649);
    var G__4648__4651 = G__4648__4649;
    while(true) {
      goog.dom.forms.setValue.call(null, node__4650, value);
      var temp__3843__auto____4652 = cljs.core.next.call(null, G__4648__4651);
      if(cljs.core.truth_(temp__3843__auto____4652)) {
        var G__4648__4653 = temp__3843__auto____4652;
        var G__4654 = cljs.core.first.call(null, G__4648__4653);
        var G__4655 = G__4648__4653;
        node__4650 = G__4654;
        G__4648__4651 = G__4655;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.html = function html(content) {
  return domina.single_node.call(null, content).innerHTML
};
domina.set_html_BANG_ = function set_html_BANG_(content, value) {
  var G__4656__4657 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(cljs.core.truth_(G__4656__4657)) {
    var node__4658 = cljs.core.first.call(null, G__4656__4657);
    var G__4656__4659 = G__4656__4657;
    while(true) {
      node__4658.innerHTML = value;
      var temp__3843__auto____4660 = cljs.core.next.call(null, G__4656__4659);
      if(cljs.core.truth_(temp__3843__auto____4660)) {
        var G__4656__4661 = temp__3843__auto____4660;
        var G__4662 = cljs.core.first.call(null, G__4656__4661);
        var G__4663 = G__4656__4661;
        node__4658 = G__4662;
        G__4656__4659 = G__4663;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__4664 = domina.nodes.call(null, parent_content);
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, parents__4664)))) {
    var G__4665__4666 = cljs.core.seq.call(null, domina.nodes.call(null, child_content));
    if(cljs.core.truth_(G__4665__4666)) {
      var child__4667 = cljs.core.first.call(null, G__4665__4666);
      var G__4665__4668 = G__4665__4666;
      while(true) {
        f.call(null, cljs.core.first.call(null, parents__4664), child__4667);
        var temp__3843__auto____4669 = cljs.core.next.call(null, G__4665__4668);
        if(cljs.core.truth_(temp__3843__auto____4669)) {
          var G__4665__4670 = temp__3843__auto____4669;
          var G__4683 = cljs.core.first.call(null, G__4665__4670);
          var G__4684 = G__4665__4670;
          child__4667 = G__4683;
          G__4665__4668 = G__4684;
          continue
        }else {
        }
        break
      }
    }else {
    }
    var G__4671__4673 = cljs.core.seq.call(null, cljs.core.rest.call(null, parents__4664));
    if(cljs.core.truth_(G__4671__4673)) {
      var parent__4674 = cljs.core.first.call(null, G__4671__4673);
      var G__4671__4675 = G__4671__4673;
      while(true) {
        var G__4672__4676 = cljs.core.seq.call(null, domina.nodes.call(null, domina.clone.call(null, child_content)));
        if(cljs.core.truth_(G__4672__4676)) {
          var child__4677 = cljs.core.first.call(null, G__4672__4676);
          var G__4672__4678 = G__4672__4676;
          while(true) {
            f.call(null, parent__4674, child__4677);
            var temp__3843__auto____4679 = cljs.core.next.call(null, G__4672__4678);
            if(cljs.core.truth_(temp__3843__auto____4679)) {
              var G__4672__4680 = temp__3843__auto____4679;
              var G__4685 = cljs.core.first.call(null, G__4672__4680);
              var G__4686 = G__4672__4680;
              child__4677 = G__4685;
              G__4672__4678 = G__4686;
              continue
            }else {
            }
            break
          }
        }else {
        }
        var temp__3843__auto____4681 = cljs.core.next.call(null, G__4671__4675);
        if(cljs.core.truth_(temp__3843__auto____4681)) {
          var G__4671__4682 = temp__3843__auto____4681;
          var G__4687 = cljs.core.first.call(null, G__4671__4682);
          var G__4688 = G__4671__4682;
          parent__4674 = G__4687;
          G__4671__4675 = G__4688;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  }else {
    return null
  }
};
domina.lazy_nodelist = function() {
  var lazy_nodelist = null;
  var lazy_nodelist__4689 = function(nl) {
    return lazy_nodelist.call(null, nl, 0)
  };
  var lazy_nodelist__4690 = function(nl, n) {
    if(cljs.core.truth_(n < nl.length)) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl.item(n), lazy_nodelist.call(null, nl, n + 1))
      })
    }else {
      return null
    }
  };
  lazy_nodelist = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nodelist__4689.call(this, nl);
      case 2:
        return lazy_nodelist__4690.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return lazy_nodelist
}();
domina.create_wrapper = function create_wrapper(table_level) {
  return document.createElement(cljs.core.truth_(table_level) ? cljs.core.truth_(cljs.core.set(["td", "th"]).call(null, table_level)) ? "tr" : "table" : "div")
};
domina.set_wrapper_html_BANG_ = function set_wrapper_html_BANG_(wrapper, content) {
  if(cljs.core.truth_(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT)) {
    wrapper.innerHTML = cljs.core.str.call(null, "<br>", content);
    return wrapper.removeChild(wrapper.firstChild)
  }else {
    return wrapper.innerHTML = content
  }
};
domina.extract_wrapper_dom = function extract_wrapper_dom(wrapper, table_level) {
  var inner_wrapper__4692 = cljs.core.truth_(cljs.core._EQ_.call(null, table_level, "tr")) ? cljs.core.first.call(null, goog.dom.getElementsByTagNameAndClass.call(null, "tbody", null, wrapper)) : wrapper;
  var children__4693 = inner_wrapper__4692.childNodes;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, children__4693.length, 1))) {
    return inner_wrapper__4692.removeChild(inner_wrapper__4692.firstChild)
  }else {
    return children__4693
  }
};
domina.string_to_dom = function string_to_dom(content) {
  var vec__4694__4695 = cljs.core.re_find.call(null, /^<(t(head|body|foot|[rhd]))/, content);
  var ___4696 = cljs.core.nth.call(null, vec__4694__4695, 0, null);
  var table_level__4697 = cljs.core.nth.call(null, vec__4694__4695, 1, null);
  var ___4698 = cljs.core.nthnext.call(null, vec__4694__4695, 2);
  var wrapper__4699 = domina.create_wrapper.call(null, table_level__4697);
  domina.set_wrapper_html_BANG_.call(null, wrapper__4699, content);
  return domina.extract_wrapper_dom.call(null, wrapper__4699, table_level__4697)
};
domina.DomContent["_"] = true;
domina.nodes["_"] = function(content) {
  return cljs.core.seq.call(null, content)
};
domina.single_node["_"] = function(content) {
  return cljs.core.first.call(null, content)
};
DocumentFragment.prototype.domina$DomContent$ = true;
DocumentFragment.prototype.domina$DomContent$nodes = function(content) {
  return cljs.core.cons.call(null, content)
};
DocumentFragment.prototype.domina$DomContent$single_node = function(content) {
  return content
};
Element.prototype.domina$DomContent$ = true;
Element.prototype.domina$DomContent$nodes = function(content) {
  return cljs.core.cons.call(null, content)
};
Element.prototype.domina$DomContent$single_node = function(content) {
  return content
};
domina.DomContent["string"] = true;
domina.nodes["string"] = function(s) {
  return domina.nodes.call(null, domina.string_to_dom.call(null, s))
};
domina.single_node["string"] = function(s) {
  return domina.single_node.call(null, domina.string_to_dom.call(null, s))
};
NodeList.prototype.cljs$core$ISeqable$ = true;
NodeList.prototype.cljs$core$ISeqable$_seq = function(nodelist) {
  return domina.lazy_nodelist.call(null, nodelist)
};
NodeList.prototype.cljs$core$IIndexed$ = true;
NodeList.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4700 = null;
  var G__4700__4701 = function(nodelist, n) {
    return nodelist.item(n)
  };
  var G__4700__4702 = function(nodelist, n, not_found) {
    if(cljs.core.truth_(nodelist.length <= n)) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  G__4700 = function(nodelist, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4700__4701.call(this, nodelist, n);
      case 3:
        return G__4700__4702.call(this, nodelist, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4700
}();
NodeList.prototype.cljs$core$ICounted$ = true;
NodeList.prototype.cljs$core$ICounted$_count = function(nodelist) {
  return nodelist.length
};
if(cljs.core.truth_(window.StaticNodeList)) {
  StaticNodeList.prototype.cljs$core$ISeqable$ = true;
  StaticNodeList.prototype.cljs$core$ISeqable$_seq = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$ = true;
  StaticNodeList.prototype.cljs$core$IIndexed$_nth = function() {
    var G__4704 = null;
    var G__4704__4705 = function(nodelist, n) {
      return nodelist.item(n)
    };
    var G__4704__4706 = function(nodelist, n, not_found) {
      if(cljs.core.truth_(nodelist.length <= n)) {
        return not_found
      }else {
        return cljs.core.nth.call(null, nodelist, n)
      }
    };
    G__4704 = function(nodelist, n, not_found) {
      switch(arguments.length) {
        case 2:
          return G__4704__4705.call(this, nodelist, n);
        case 3:
          return G__4704__4706.call(this, nodelist, n, not_found)
      }
      throw"Invalid arity: " + arguments.length;
    };
    return G__4704
  }();
  StaticNodeList.prototype.cljs$core$ICounted$ = true;
  StaticNodeList.prototype.cljs$core$ICounted$_count = function(nodelist) {
    return nodelist.length
  }
}else {
}
HTMLCollection.prototype.cljs$core$ISeqable$ = true;
HTMLCollection.prototype.cljs$core$ISeqable$_seq = function(coll) {
  return domina.lazy_nodelist.call(null, coll)
};
HTMLCollection.prototype.cljs$core$IIndexed$ = true;
HTMLCollection.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4708 = null;
  var G__4708__4709 = function(coll, n) {
    return coll.item(n)
  };
  var G__4708__4710 = function(coll, n, not_found) {
    if(cljs.core.truth_(coll.length <= n)) {
      return not_found
    }else {
      return cljs.core.nth.call(null, coll, n)
    }
  };
  G__4708 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4708__4709.call(this, coll, n);
      case 3:
        return G__4708__4710.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4708
}();
HTMLCollection.prototype.cljs$core$ICounted$ = true;
HTMLCollection.prototype.cljs$core$ICounted$_count = function(coll) {
  return coll.length
};
goog.provide("one.logging");
goog.require("cljs.core");
goog.require("goog.debug.Console");
goog.require("goog.debug.FancyWindow");
goog.require("goog.debug.Logger");
one.logging.ILogViewer = {};
one.logging.start_display = function start_display(this$) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4712 = this$;
    if(cljs.core.truth_(and__3691__auto____4712)) {
      return this$.one$logging$ILogViewer$start_display
    }else {
      return and__3691__auto____4712
    }
  }())) {
    return this$.one$logging$ILogViewer$start_display(this$)
  }else {
    return function() {
      var or__3693__auto____4713 = one.logging.start_display[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3693__auto____4713)) {
        return or__3693__auto____4713
      }else {
        var or__3693__auto____4714 = one.logging.start_display["_"];
        if(cljs.core.truth_(or__3693__auto____4714)) {
          return or__3693__auto____4714
        }else {
          throw cljs.core.missing_protocol.call(null, "ILogViewer.start-display", this$);
        }
      }
    }().call(null, this$)
  }
};
one.logging.stop_display = function stop_display(this$) {
  if(cljs.core.truth_(function() {
    var and__3691__auto____4715 = this$;
    if(cljs.core.truth_(and__3691__auto____4715)) {
      return this$.one$logging$ILogViewer$stop_display
    }else {
      return and__3691__auto____4715
    }
  }())) {
    return this$.one$logging$ILogViewer$stop_display(this$)
  }else {
    return function() {
      var or__3693__auto____4716 = one.logging.stop_display[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3693__auto____4716)) {
        return or__3693__auto____4716
      }else {
        var or__3693__auto____4717 = one.logging.stop_display["_"];
        if(cljs.core.truth_(or__3693__auto____4717)) {
          return or__3693__auto____4717
        }else {
          throw cljs.core.missing_protocol.call(null, "ILogViewer.stop-display", this$);
        }
      }
    }().call(null, this$)
  }
};
one.logging.levels = cljs.core.ObjMap.fromObject(["\ufdd0'severe", "\ufdd0'warning", "\ufdd0'info", "\ufdd0'config", "\ufdd0'fine", "\ufdd0'finer", "\ufdd0'finest"], {"\ufdd0'severe":goog.debug.Logger.Level.SEVERE, "\ufdd0'warning":goog.debug.Logger.Level.WARNING, "\ufdd0'info":goog.debug.Logger.Level.INFO, "\ufdd0'config":goog.debug.Logger.Level.CONFIG, "\ufdd0'fine":goog.debug.Logger.Level.FINE, "\ufdd0'finer":goog.debug.Logger.Level.FINER, "\ufdd0'finest":goog.debug.Logger.Level.FINEST});
one.logging.get_logger = function get_logger(name) {
  return goog.debug.Logger.getLogger.call(null, name)
};
one.logging.severe = function severe(logger, s) {
  return logger.severe(s)
};
one.logging.warning = function warning(logger, s) {
  return logger.warning(s)
};
one.logging.info = function info(logger, s) {
  return logger.info(s)
};
one.logging.config = function config(logger, s) {
  return logger.config(s)
};
one.logging.fine = function fine(logger, s) {
  return logger.fine(s)
};
one.logging.finer = function finer(logger, s) {
  return logger.finer(s)
};
one.logging.finest = function finest(logger, s) {
  return logger.finest(s)
};
one.logging.set_level = function set_level(logger, level) {
  return logger.setLevel(cljs.core.get.call(null, one.logging.levels, level, goog.debug.Logger.Level.INFO))
};
goog.debug.FancyWindow.prototype.one$logging$ILogViewer$ = true;
goog.debug.FancyWindow.prototype.one$logging$ILogViewer$start_display = function(this$) {
  var G__4718__4719 = this$;
  G__4718__4719.setEnabled(true);
  G__4718__4719.init(cljs.core.List.EMPTY);
  return G__4718__4719
};
goog.debug.FancyWindow.prototype.one$logging$ILogViewer$stop_display = function(this$) {
  return this$.setCapturing(false)
};
goog.debug.Console.prototype.one$logging$ILogViewer$ = true;
goog.debug.Console.prototype.one$logging$ILogViewer$start_display = function(this$) {
  return this$.setCapturing(true)
};
goog.debug.Console.prototype.one$logging$ILogViewer$stop_display = function(this$) {
  return this$.setCapturing(false)
};
one.logging.console_output = function console_output() {
  return new goog.debug.Console
};
one.logging.fancy_output = function fancy_output(name) {
  return new goog.debug.FancyWindow(name)
};
goog.provide("one.dispatch");
goog.require("cljs.core");
one.dispatch.reactions = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
one.dispatch.react_to = function() {
  var react_to = null;
  var react_to__4721 = function(event_pred, reactor) {
    return react_to.call(null, null, event_pred, reactor)
  };
  var react_to__4722 = function(max_count, event_pred, reactor) {
    var reaction__4720 = cljs.core.ObjMap.fromObject(["\ufdd0'max-count", "\ufdd0'event-pred", "\ufdd0'reactor"], {"\ufdd0'max-count":max_count, "\ufdd0'event-pred":event_pred, "\ufdd0'reactor":reactor});
    cljs.core.swap_BANG_.call(null, one.dispatch.reactions, cljs.core.assoc, reaction__4720, 0);
    return reaction__4720
  };
  react_to = function(max_count, event_pred, reactor) {
    switch(arguments.length) {
      case 2:
        return react_to__4721.call(this, max_count, event_pred);
      case 3:
        return react_to__4722.call(this, max_count, event_pred, reactor)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return react_to
}();
one.dispatch.delete_reaction = function delete_reaction(reaction) {
  return cljs.core.swap_BANG_.call(null, one.dispatch.reactions, cljs.core.dissoc, reaction)
};
one.dispatch.fire = function() {
  var fire = null;
  var fire__4765 = function(event_id) {
    return fire.call(null, event_id, null)
  };
  var fire__4766 = function(event_id, event_data) {
    var matching_reactions__4738 = cljs.core.filter.call(null, function(p__4730) {
      var vec__4731__4733 = p__4730;
      var map__4732__4734 = cljs.core.nth.call(null, vec__4731__4733, 0, null);
      var map__4732__4735 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4732__4734)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4732__4734) : map__4732__4734;
      var event_pred__4736 = cljs.core.get.call(null, map__4732__4735, "\ufdd0'event-pred");
      var run_count__4737 = cljs.core.nth.call(null, vec__4731__4733, 1, null);
      return event_pred__4736.call(null, event_id)
    }, cljs.core.deref.call(null, one.dispatch.reactions));
    var G__4739__4740 = cljs.core.seq.call(null, matching_reactions__4738);
    if(cljs.core.truth_(G__4739__4740)) {
      var G__4742__4744 = cljs.core.first.call(null, G__4739__4740);
      var vec__4743__4745 = G__4742__4744;
      var reaction__4746 = cljs.core.nth.call(null, vec__4743__4745, 0, null);
      var run_count__4747 = cljs.core.nth.call(null, vec__4743__4745, 1, null);
      var G__4739__4748 = G__4739__4740;
      var G__4742__4749 = G__4742__4744;
      var G__4739__4750 = G__4739__4748;
      while(true) {
        var vec__4751__4752 = G__4742__4749;
        var reaction__4753 = cljs.core.nth.call(null, vec__4751__4752, 0, null);
        var run_count__4754 = cljs.core.nth.call(null, vec__4751__4752, 1, null);
        var G__4739__4755 = G__4739__4750;
        var map__4756__4757 = reaction__4753;
        var map__4756__4758 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4756__4757)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4756__4757) : map__4756__4757;
        var reactor__4759 = cljs.core.get.call(null, map__4756__4758, "\ufdd0'reactor");
        var max_count__4760 = cljs.core.get.call(null, map__4756__4758, "\ufdd0'max-count");
        var run_count__4761 = run_count__4754 + 1;
        reactor__4759.call(null, event_id, event_data);
        if(cljs.core.truth_(function() {
          var and__3691__auto____4762 = max_count__4760;
          if(cljs.core.truth_(and__3691__auto____4762)) {
            return max_count__4760 <= run_count__4761
          }else {
            return and__3691__auto____4762
          }
        }())) {
          one.dispatch.delete_reaction.call(null, reaction__4753)
        }else {
          cljs.core.swap_BANG_.call(null, one.dispatch.reactions, cljs.core.assoc, reaction__4753, run_count__4761)
        }
        var temp__3843__auto____4763 = cljs.core.next.call(null, G__4739__4755);
        if(cljs.core.truth_(temp__3843__auto____4763)) {
          var G__4739__4764 = temp__3843__auto____4763;
          var G__4768 = cljs.core.first.call(null, G__4739__4764);
          var G__4769 = G__4739__4764;
          G__4742__4749 = G__4768;
          G__4739__4750 = G__4769;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  };
  fire = function(event_id, event_data) {
    switch(arguments.length) {
      case 1:
        return fire__4765.call(this, event_id);
      case 2:
        return fire__4766.call(this, event_id, event_data)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fire
}();
goog.provide("org_html_slides.main");
goog.require("cljs.core");
goog.require("goog.Uri");
goog.require("goog.dom.classes");
goog.require("goog.events.KeyCodes");
goog.require("goog.window");
goog.require("goog.events");
goog.require("goog.Timer");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("one.dispatch");
goog.require("one.logging");
goog.require("goog.events.KeyHandler");
goog.require("goog.debug.Console");
goog.require("goog.string.format");
goog.require("goog.style");
goog.require("goog.debug.Logger");
goog.require("domina");
goog.require("goog.array");
goog.require("goog.events.EventType");
org_html_slides.main.stylesheet_urls = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
org_html_slides.main.slides = cljs.core.atom.call(null, null);
org_html_slides.main.slideshow_mode_QMARK_ = cljs.core.atom.call(null, false);
org_html_slides.main.presenter_window = cljs.core.atom.call(null, null);
org_html_slides.main.presenter_start_time = cljs.core.atom.call(null, null);
org_html_slides.main.info = function() {
  var info__delegate = function(msgs) {
    return one.logging.info.call(null, one.logging.get_logger.call(null, "org_html_slides.main"), cljs.core.apply.call(null, cljs.core.pr_str, msgs))
  };
  var info = function(var_args) {
    var msgs = null;
    if(goog.isDef(var_args)) {
      msgs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return info__delegate.call(this, msgs)
  };
  info.cljs$lang$maxFixedArity = 0;
  info.cljs$lang$applyTo = function(arglist__4772) {
    var msgs = cljs.core.seq(arglist__4772);
    return info__delegate.call(this, msgs)
  };
  return info
}();
org_html_slides.main.dom_tags = function() {
  var dom_tags = null;
  var dom_tags__4773 = function(tag_name) {
    return goog.array.toArray.call(null, goog.dom.getElementsByTagNameAndClass.call(null, tag_name))
  };
  var dom_tags__4774 = function(tag_name, class_name) {
    return goog.array.toArray.call(null, goog.dom.getElementsByTagNameAndClass.call(null, tag_name, class_name))
  };
  var dom_tags__4775 = function(tag_name, class_name, inside_elem) {
    return goog.array.toArray.call(null, goog.dom.getElementsByTagNameAndClass.call(null, tag_name, class_name, inside_elem))
  };
  dom_tags = function(tag_name, class_name, inside_elem) {
    switch(arguments.length) {
      case 1:
        return dom_tags__4773.call(this, tag_name);
      case 2:
        return dom_tags__4774.call(this, tag_name, class_name);
      case 3:
        return dom_tags__4775.call(this, tag_name, class_name, inside_elem)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dom_tags
}();
org_html_slides.main.remove_elem = function remove_elem(elem) {
  return elem.parentNode.removeChild(elem)
};
org_html_slides.main.add_to_head = function() {
  var add_to_head = null;
  var add_to_head__4777 = function(elem) {
    return add_to_head.call(null, elem, null)
  };
  var add_to_head__4778 = function(elem, parent) {
    return cljs.core.first.call(null, org_html_slides.main.dom_tags.call(null, "head", null, parent)).appendChild(elem)
  };
  add_to_head = function(elem, parent) {
    switch(arguments.length) {
      case 1:
        return add_to_head__4777.call(this, elem);
      case 2:
        return add_to_head__4778.call(this, elem, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return add_to_head
}();
org_html_slides.main.body_elem = function body_elem() {
  return cljs.core.first.call(null, org_html_slides.main.dom_tags.call(null, "body"))
};
org_html_slides.main.next_elem = function next_elem(elem) {
  var or__3693__auto____4780 = elem.firstChild;
  if(cljs.core.truth_(or__3693__auto____4780)) {
    return or__3693__auto____4780
  }else {
    var or__3693__auto____4781 = elem.nextSibling;
    if(cljs.core.truth_(or__3693__auto____4781)) {
      return or__3693__auto____4781
    }else {
      var temp__3843__auto____4782 = elem.parentNode;
      if(cljs.core.truth_(temp__3843__auto____4782)) {
        var parent__4783 = temp__3843__auto____4782;
        return parent__4783.nextSibling
      }else {
        return null
      }
    }
  }
};
org_html_slides.main.location_fragment = function location_fragment() {
  return goog.Uri.parse.call(null, window.location).getFragment()
};
org_html_slides.main.set_location_fragment = function set_location_fragment(fragment_id) {
  var uri__4784 = goog.Uri.parse.call(null, window.location);
  uri__4784.setFragment(fragment_id);
  return window.location = cljs.core.str.call(null, uri__4784)
};
org_html_slides.main.fire_handler = function fire_handler(event_id) {
  return function(goog_event) {
    if(cljs.core.truth_(goog_event)) {
      goog_event.preventDefault();
      goog_event.stopPropagation()
    }else {
    }
    return one.dispatch.fire.call(null, event_id, goog_event)
  }
};
org_html_slides.main.show_BANG_ = function show_BANG_(content) {
  if(cljs.core.truth_(content)) {
    return goog.style.showElement.call(null, domina.single_node.call(null, content), true)
  }else {
    return null
  }
};
org_html_slides.main.hide_BANG_ = function hide_BANG_(content) {
  if(cljs.core.truth_(content)) {
    return goog.style.showElement.call(null, domina.single_node.call(null, content), false)
  }else {
    return null
  }
};
org_html_slides.main.stylesheets = function stylesheets(media_type) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__4785_SHARP_) {
    return domina.attr.call(null, p1__4785_SHARP_, "href")
  }, cljs.core.filter.call(null, function(elem) {
    var and__3691__auto____4786 = cljs.core._EQ_.call(null, "stylesheet", domina.attr.call(null, elem, "rel"));
    if(cljs.core.truth_(and__3691__auto____4786)) {
      return cljs.core._EQ_.call(null, media_type, domina.attr.call(null, elem, "media"))
    }else {
      return and__3691__auto____4786
    }
  }, org_html_slides.main.dom_tags.call(null, "link"))))
};
org_html_slides.main.remove_stylesheets = function remove_stylesheets(urls) {
  var G__4787__4789 = cljs.core.seq.call(null, cljs.core.filter.call(null, function(elem) {
    var and__3691__auto____4788 = cljs.core._EQ_.call(null, "stylesheet", domina.attr.call(null, elem, "rel"));
    if(cljs.core.truth_(and__3691__auto____4788)) {
      return cljs.core.contains_QMARK_.call(null, urls, domina.attr.call(null, elem, "href"))
    }else {
      return and__3691__auto____4788
    }
  }, org_html_slides.main.dom_tags.call(null, "link")));
  if(cljs.core.truth_(G__4787__4789)) {
    var elem__4790 = cljs.core.first.call(null, G__4787__4789);
    var G__4787__4791 = G__4787__4789;
    while(true) {
      org_html_slides.main.remove_elem.call(null, elem__4790);
      var temp__3843__auto____4792 = cljs.core.next.call(null, G__4787__4791);
      if(cljs.core.truth_(temp__3843__auto____4792)) {
        var G__4787__4793 = temp__3843__auto____4792;
        var G__4794 = cljs.core.first.call(null, G__4787__4793);
        var G__4795 = G__4787__4793;
        elem__4790 = G__4794;
        G__4787__4791 = G__4795;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
org_html_slides.main.add_stylesheets = function() {
  var add_stylesheets = null;
  var add_stylesheets__4804 = function(urls) {
    return add_stylesheets.call(null, urls, null)
  };
  var add_stylesheets__4805 = function(urls, parent) {
    var G__4796__4797 = cljs.core.seq.call(null, urls);
    if(cljs.core.truth_(G__4796__4797)) {
      var url__4798 = cljs.core.first.call(null, G__4796__4797);
      var G__4796__4799 = G__4796__4797;
      while(true) {
        org_html_slides.main.add_to_head.call(null, function() {
          var G__4800__4801 = goog.dom.createDom.call(null, "link");
          G__4800__4801.setAttribute("rel", "stylesheet");
          G__4800__4801.setAttribute("type", "text/css");
          G__4800__4801.setAttribute("href", url__4798);
          return G__4800__4801
        }(), parent);
        var temp__3843__auto____4802 = cljs.core.next.call(null, G__4796__4799);
        if(cljs.core.truth_(temp__3843__auto____4802)) {
          var G__4796__4803 = temp__3843__auto____4802;
          var G__4807 = cljs.core.first.call(null, G__4796__4803);
          var G__4808 = G__4796__4803;
          url__4798 = G__4807;
          G__4796__4799 = G__4808;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  };
  add_stylesheets = function(urls, parent) {
    switch(arguments.length) {
      case 1:
        return add_stylesheets__4804.call(this, urls);
      case 2:
        return add_stylesheets__4805.call(this, urls, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return add_stylesheets
}();
org_html_slides.main.get_folds = function get_folds() {
  return cljs.core.vec.call(null, cljs.core.map.call(null, function(elem) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'head-elem", "\ufdd0'body-elem"], {"\ufdd0'head-elem":elem.parentNode.parentNode, "\ufdd0'body-elem":cljs.core.first.call(null, org_html_slides.main.dom_tags.call(null, "div", null, org_html_slides.main.nearest_containing_div.call(null, elem)))})
  }, org_html_slides.main.dom_tags.call(null, "span", "fold")))
};
org_html_slides.main.show_hide_html = ' <a href="#" class="show-hide"><span>show/hide</span></a>';
org_html_slides.main.toggle_visibility = function toggle_visibility(head, body) {
  if(cljs.core.truth_(goog.style.isElementShown.call(null, body))) {
    goog.style.showElement.call(null, body, false);
    goog.dom.classes.remove.call(null, head, "unfolded");
    return goog.dom.classes.add.call(null, head, "folded")
  }else {
    goog.style.showElement.call(null, body, true);
    goog.dom.classes.remove.call(null, head, "folded");
    return goog.dom.classes.add.call(null, head, "unfolded")
  }
};
org_html_slides.main.handle_show_hide = function handle_show_hide(event) {
  event.preventDefault();
  var head_elem__4809 = event.currentTarget;
  var body_elem__4810 = cljs.core.first.call(null, org_html_slides.main.dom_tags.call(null, "div", null, org_html_slides.main.nearest_containing_div.call(null, head_elem__4809)));
  return org_html_slides.main.toggle_visibility.call(null, head_elem__4809, body_elem__4810)
};
org_html_slides.main.install_folds = function install_folds() {
  var G__4811__4812 = cljs.core.seq.call(null, org_html_slides.main.get_folds.call(null));
  if(cljs.core.truth_(G__4811__4812)) {
    var G__4814__4816 = cljs.core.first.call(null, G__4811__4812);
    var map__4815__4817 = G__4814__4816;
    var map__4815__4818 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4815__4817)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4815__4817) : map__4815__4817;
    var body_elem__4819 = cljs.core.get.call(null, map__4815__4818, "\ufdd0'body-elem");
    var head_elem__4820 = cljs.core.get.call(null, map__4815__4818, "\ufdd0'head-elem");
    var G__4811__4821 = G__4811__4812;
    var G__4814__4822 = G__4814__4816;
    var G__4811__4823 = G__4811__4821;
    while(true) {
      var map__4824__4825 = G__4814__4822;
      var map__4824__4826 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4824__4825)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4824__4825) : map__4824__4825;
      var body_elem__4827 = cljs.core.get.call(null, map__4824__4826, "\ufdd0'body-elem");
      var head_elem__4828 = cljs.core.get.call(null, map__4824__4826, "\ufdd0'head-elem");
      var G__4811__4829 = G__4811__4823;
      org_html_slides.main.toggle_visibility.call(null, head_elem__4828, body_elem__4827);
      var a__4830 = goog.dom.htmlToDocumentFragment.call(null, org_html_slides.main.show_hide_html);
      head_elem__4828.appendChild(a__4830);
      var a__4831 = org_html_slides.main.dom_tags.call(null, "a", "show-hide", head_elem__4828);
      goog.events.listen.call(null, head_elem__4828, goog.events.EventType.CLICK, org_html_slides.main.handle_show_hide);
      var temp__3843__auto____4832 = cljs.core.next.call(null, G__4811__4829);
      if(cljs.core.truth_(temp__3843__auto____4832)) {
        var G__4811__4833 = temp__3843__auto____4832;
        var G__4834 = cljs.core.first.call(null, G__4811__4833);
        var G__4835 = G__4811__4833;
        G__4814__4822 = G__4834;
        G__4811__4823 = G__4835;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
org_html_slides.main.control_html = '<div id="c-panel">\n<a id="c-toggle" href="#">\n  <span class="label">Toggle slide-show mode</span>\n  <span class="key">T</span>\n</a>\n<a id="c-first" href="#">\n  <span class="label">First slide</span>\n  <span class="key">Home</span>\n</a>\n<a id="c-prev" href="#">\n  <span class="label">Previous slide</span>\n  <span class="key">P</span>\n</a>\n<a id="c-next" href="#">\n  <span class="label">Next slide</span>\n  <span class="key">N</span>\n</a>\n<a id="c-last" href="#">\n  <span class="label">Last slide</span>\n  <span class="key">End</span>\n</a>\n<a id="c-presenter-window" href="#">\n  <span class="label">Open presenter preview</span>\n</a>\n</div>';
org_html_slides.main.show_control_panel = function show_control_panel() {
  return goog.style.setStyle.call(null, goog.dom.getElement.call(null, "c-panel"), "opacity", 0.75)
};
org_html_slides.main.hide_control_panel = function hide_control_panel() {
  return goog.style.setStyle.call(null, goog.dom.getElement.call(null, "c-panel"), "opacity", 0)
};
org_html_slides.main.install_control_panel = function install_control_panel() {
  org_html_slides.main.body_elem.call(null).appendChild(goog.dom.htmlToDocumentFragment.call(null, org_html_slides.main.control_html));
  var panel__4836 = goog.dom.getElement.call(null, "c-panel");
  one.dispatch.fire.call(null, "\ufdd0'show-control-panel");
  goog.Timer.callOnce.call(null, org_html_slides.main.fire_handler.call(null, "\ufdd0'hide-control-panel"), 3E3);
  goog.events.listen.call(null, panel__4836, goog.events.EventType.MOUSEOVER, org_html_slides.main.fire_handler.call(null, "\ufdd0'show-control-panel"));
  goog.events.listen.call(null, panel__4836, goog.events.EventType.MOUSEOUT, org_html_slides.main.fire_handler.call(null, "\ufdd0'hide-control-panel"));
  goog.events.listen.call(null, goog.dom.getElement.call(null, "c-toggle"), goog.events.EventType.CLICK, org_html_slides.main.fire_handler.call(null, "\ufdd0'toggle-mode"));
  goog.events.listen.call(null, goog.dom.getElement.call(null, "c-first"), goog.events.EventType.CLICK, org_html_slides.main.fire_handler.call(null, "\ufdd0'show-first-slide"));
  goog.events.listen.call(null, goog.dom.getElement.call(null, "c-prev"), goog.events.EventType.CLICK, org_html_slides.main.fire_handler.call(null, "\ufdd0'show-prev-slide"));
  goog.events.listen.call(null, goog.dom.getElement.call(null, "c-next"), goog.events.EventType.CLICK, org_html_slides.main.fire_handler.call(null, "\ufdd0'show-next-slide"));
  goog.events.listen.call(null, goog.dom.getElement.call(null, "c-last"), goog.events.EventType.CLICK, org_html_slides.main.fire_handler.call(null, "\ufdd0'show-last-slide"));
  return goog.events.listen.call(null, goog.dom.getElement.call(null, "c-presenter-window"), goog.events.EventType.CLICK, org_html_slides.main.fire_handler.call(null, "\ufdd0'show-presenter-window"))
};
org_html_slides.main.current_slide_div_html = '<div id="current-slide"></div>';
org_html_slides.main.nearest_containing_div = function nearest_containing_div(elem) {
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, "DIV", elem.nodeName))) {
      return elem
    }else {
      var G__4838 = elem.parentNode;
      elem = G__4838;
      continue
    }
    break
  }
};
org_html_slides.main.heading_tag_names = cljs.core.set.call(null, cljs.core.map.call(null, function(p1__4837_SHARP_) {
  return cljs.core.str.call(null, "H", p1__4837_SHARP_)
}, cljs.core.range.call(null, 1, 9)));
org_html_slides.main.nearest_inside_heading = function nearest_inside_heading(elem) {
  while(true) {
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, org_html_slides.main.heading_tag_names, elem.nodeName))) {
      return elem
    }else {
      var G__4839 = org_html_slides.main.next_elem.call(null, elem);
      elem = G__4839;
      continue
    }
    break
  }
};
org_html_slides.main.copy_heading_tags_to_div_classes = function copy_heading_tags_to_div_classes() {
  var G__4841__4842 = cljs.core.seq.call(null, org_html_slides.main.dom_tags.call(null, "span", "tag"));
  if(cljs.core.truth_(G__4841__4842)) {
    var tags__4843 = cljs.core.first.call(null, G__4841__4842);
    var G__4841__4844 = G__4841__4842;
    while(true) {
      var div__4845 = org_html_slides.main.nearest_containing_div.call(null, tags__4843);
      var G__4846__4847 = cljs.core.seq.call(null, org_html_slides.main.dom_tags.call(null, "span", null, tags__4843));
      if(cljs.core.truth_(G__4846__4847)) {
        var tag__4848 = cljs.core.first.call(null, G__4846__4847);
        var G__4846__4849 = G__4846__4847;
        while(true) {
          goog.dom.classes.add.call(null, div__4845, goog.dom.classes.get.call(null, tag__4848));
          var temp__3843__auto____4850 = cljs.core.next.call(null, G__4846__4849);
          if(cljs.core.truth_(temp__3843__auto____4850)) {
            var G__4846__4851 = temp__3843__auto____4850;
            var G__4854 = cljs.core.first.call(null, G__4846__4851);
            var G__4855 = G__4846__4851;
            tag__4848 = G__4854;
            G__4846__4849 = G__4855;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3843__auto____4852 = cljs.core.next.call(null, G__4841__4844);
      if(cljs.core.truth_(temp__3843__auto____4852)) {
        var G__4841__4853 = temp__3843__auto____4852;
        var G__4856 = cljs.core.first.call(null, G__4841__4853);
        var G__4857 = G__4841__4853;
        tags__4843 = G__4856;
        G__4841__4844 = G__4857;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
org_html_slides.main.remove_nested_sections = function remove_nested_sections(slide_div_elem) {
  var div__4858 = slide_div_elem.cloneNode(true);
  var G__4859__4860 = cljs.core.seq.call(null, org_html_slides.main.dom_tags.call(null, "div", null, div__4858));
  if(cljs.core.truth_(G__4859__4860)) {
    var elem__4861 = cljs.core.first.call(null, G__4859__4860);
    var G__4859__4862 = G__4859__4860;
    while(true) {
      if(cljs.core.truth_(cljs.core.some.call(null, function(elem__4861, G__4859__4862) {
        return function(p1__4840_SHARP_) {
          return goog.dom.classes.has.call(null, elem__4861, cljs.core.str.call(null, "outline-", p1__4840_SHARP_))
        }
      }(elem__4861, G__4859__4862), cljs.core.range.call(null, 1, 9)))) {
        org_html_slides.main.remove_elem.call(null, elem__4861)
      }else {
      }
      var temp__3843__auto____4863 = cljs.core.next.call(null, G__4859__4862);
      if(cljs.core.truth_(temp__3843__auto____4863)) {
        var G__4859__4864 = temp__3843__auto____4863;
        var G__4865 = cljs.core.first.call(null, G__4859__4864);
        var G__4866 = G__4859__4864;
        elem__4861 = G__4865;
        G__4859__4862 = G__4866;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return div__4858
};
org_html_slides.main.get_slides = function get_slides() {
  return cljs.core.vec.call(null, cljs.core.map.call(null, function(elem) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'html"], {"\ufdd0'id":org_html_slides.main.nearest_inside_heading.call(null, elem).id, "\ufdd0'html":goog.dom.getOuterHtml.call(null, org_html_slides.main.remove_nested_sections.call(null, elem))})
  }, org_html_slides.main.dom_tags.call(null, "div", "slide")))
};
org_html_slides.main.slide_from_id = function slide_from_id(id) {
  return cljs.core.some.call(null, function(slide) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, id, "\ufdd0'id".call(null, slide)))) {
      return slide
    }else {
      return null
    }
  }, cljs.core.deref.call(null, org_html_slides.main.slides))
};
org_html_slides.main.find_slide_after = function find_slide_after(id) {
  return cljs.core.second.call(null, cljs.core.drop_while.call(null, function(p1__4867_SHARP_) {
    return goog.string.numerateCompare.call(null, id, "\ufdd0'id".call(null, p1__4867_SHARP_)) > 0
  }, cljs.core.deref.call(null, org_html_slides.main.slides)))
};
org_html_slides.main.current_slide = function current_slide() {
  var fragment_id__4868 = org_html_slides.main.location_fragment.call(null);
  var or__3693__auto____4869 = org_html_slides.main.slide_from_id.call(null, fragment_id__4868);
  if(cljs.core.truth_(or__3693__auto____4869)) {
    return or__3693__auto____4869
  }else {
    var or__3693__auto____4871 = function() {
      var and__3691__auto____4870 = cljs.core.seq.call(null, fragment_id__4868);
      if(cljs.core.truth_(and__3691__auto____4870)) {
        return org_html_slides.main.find_slide_after.call(null, fragment_id__4868)
      }else {
        return and__3691__auto____4870
      }
    }();
    if(cljs.core.truth_(or__3693__auto____4871)) {
      return or__3693__auto____4871
    }else {
      return cljs.core.first.call(null, cljs.core.deref.call(null, org_html_slides.main.slides))
    }
  }
};
org_html_slides.main.next_slide = function next_slide() {
  return org_html_slides.main.find_slide_after.call(null, "\ufdd0'id".call(null, org_html_slides.main.current_slide.call(null)))
};
org_html_slides.main.show_slide = function show_slide(p__4872) {
  var map__4873__4874 = p__4872;
  var map__4873__4875 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4873__4874)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4873__4874) : map__4873__4874;
  var html__4876 = cljs.core.get.call(null, map__4873__4875, "\ufdd0'html");
  var id__4877 = cljs.core.get.call(null, map__4873__4875, "\ufdd0'id");
  org_html_slides.main.set_location_fragment.call(null, id__4877);
  goog.dom.getElement.call(null, "current-slide").innerHTML = html__4876;
  return org_html_slides.main.show_presenter_slides.call(null)
};
org_html_slides.main.enter_slideshow_mode = function enter_slideshow_mode() {
  org_html_slides.main.info.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'enter-slideshow-mode"), cljs.core.hash_map("\ufdd0'line", 282)));
  org_html_slides.main.hide_BANG_.call(null, domina.by_id.call(null, "preamble"));
  org_html_slides.main.hide_BANG_.call(null, domina.by_id.call(null, "content"));
  org_html_slides.main.hide_BANG_.call(null, domina.by_id.call(null, "postamble"));
  org_html_slides.main.remove_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "screen"));
  org_html_slides.main.add_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "projection"));
  org_html_slides.main.show_BANG_.call(null, domina.by_id.call(null, "current-slide"));
  return org_html_slides.main.show_slide.call(null, org_html_slides.main.current_slide.call(null))
};
org_html_slides.main.leave_slideshow_mode = function leave_slideshow_mode() {
  org_html_slides.main.info.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'leave-slideshow-mode"), cljs.core.hash_map("\ufdd0'line", 292)));
  org_html_slides.main.hide_BANG_.call(null, domina.by_id.call(null, "current-slide"));
  org_html_slides.main.remove_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "projection"));
  org_html_slides.main.add_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "screen"));
  org_html_slides.main.show_BANG_.call(null, domina.by_id.call(null, "preamble"));
  org_html_slides.main.show_BANG_.call(null, domina.by_id.call(null, "content"));
  org_html_slides.main.show_BANG_.call(null, domina.by_id.call(null, "postamble"));
  return goog.dom.getElement.call(null, org_html_slides.main.location_fragment.call(null)).scrollIntoView()
};
org_html_slides.main.change_mode = function change_mode() {
  if(cljs.core.truth_(cljs.core.deref.call(null, org_html_slides.main.slideshow_mode_QMARK_))) {
    return org_html_slides.main.enter_slideshow_mode.call(null)
  }else {
    return org_html_slides.main.leave_slideshow_mode.call(null)
  }
};
org_html_slides.main.toggle_mode = function toggle_mode() {
  org_html_slides.main.info.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'toggle-mode"), cljs.core.hash_map("\ufdd0'line", 307)));
  return cljs.core.swap_BANG_.call(null, org_html_slides.main.slideshow_mode_QMARK_, cljs.core.not)
};
cljs.core.add_watch.call(null, org_html_slides.main.slideshow_mode_QMARK_, "\ufdd0'change-mode", function(k, r, o, n) {
  return one.dispatch.fire.call(null, "\ufdd0'change-mode")
});
org_html_slides.main.show_next_slide = function show_next_slide() {
  var current__4880 = org_html_slides.main.current_slide.call(null);
  var next__4881 = cljs.core.second.call(null, cljs.core.drop_while.call(null, function(p1__4878_SHARP_) {
    return cljs.core.not_EQ_.call(null, current__4880, p1__4878_SHARP_)
  }, cljs.core.deref.call(null, org_html_slides.main.slides)));
  if(cljs.core.truth_(next__4881)) {
    org_html_slides.main.show_slide.call(null, next__4881)
  }else {
  }
  return cljs.core.swap_BANG_.call(null, org_html_slides.main.presenter_start_time, function(t) {
    if(cljs.core.truth_(cljs.core.nil_QMARK_.call(null, t))) {
      return(new Date).getTime()
    }else {
      return t
    }
  })
};
org_html_slides.main.show_prev_slide = function show_prev_slide() {
  var current__4882 = org_html_slides.main.current_slide.call(null);
  var prev__4883 = cljs.core.last.call(null, cljs.core.take_while.call(null, function(p1__4879_SHARP_) {
    return cljs.core.not_EQ_.call(null, current__4882, p1__4879_SHARP_)
  }, cljs.core.deref.call(null, org_html_slides.main.slides)));
  if(cljs.core.truth_(prev__4883)) {
    return org_html_slides.main.show_slide.call(null, prev__4883)
  }else {
    return null
  }
};
org_html_slides.main.show_first_slide = function show_first_slide() {
  return org_html_slides.main.show_slide.call(null, cljs.core.first.call(null, cljs.core.deref.call(null, org_html_slides.main.slides)))
};
org_html_slides.main.show_last_slide = function show_last_slide() {
  return org_html_slides.main.show_slide.call(null, cljs.core.last.call(null, cljs.core.deref.call(null, org_html_slides.main.slides)))
};
org_html_slides.main.go_to_top = function go_to_top() {
  org_html_slides.main.set_location_fragment.call(null, "top");
  return org_html_slides.main.window.scrollTo(0, 0)
};
org_html_slides.main.normal_keymap = cljs.core.HashMap.fromArrays([goog.events.KeyCodes.T, goog.events.KeyCodes.HOME], ["\ufdd0'toggle-mode", "\ufdd0'go-to-top"]);
org_html_slides.main.slideshow_keymap = cljs.core.HashMap.fromArrays([goog.events.KeyCodes.SPACE, goog.events.KeyCodes.T, goog.events.KeyCodes.END, goog.events.KeyCodes.P, goog.events.KeyCodes.LEFT, goog.events.KeyCodes.PAGE_DOWN, goog.events.KeyCodes.ENTER, goog.events.KeyCodes.PAGE_UP, goog.events.KeyCodes.N, goog.events.KeyCodes.DOWN, goog.events.KeyCodes.UP, goog.events.KeyCodes.RIGHT, goog.events.KeyCodes.MAC_ENTER, goog.events.KeyCodes.HOME], ["\ufdd0'show-next-slide", "\ufdd0'toggle-mode", 
"\ufdd0'show-last-slide", "\ufdd0'show-prev-slide", "\ufdd0'show-prev-slide", "\ufdd0'show-next-slide", "\ufdd0'show-next-slide", "\ufdd0'show-prev-slide", "\ufdd0'show-next-slide", "\ufdd0'show-next-slide", "\ufdd0'show-prev-slide", "\ufdd0'show-next-slide", "\ufdd0'show-next-slide", "\ufdd0'show-first-slide"]);
org_html_slides.main.handle_key = function handle_key(event) {
  var code__4884 = event.keyCode;
  var keymap__4885 = cljs.core.truth_(cljs.core.deref.call(null, org_html_slides.main.slideshow_mode_QMARK_)) ? org_html_slides.main.slideshow_keymap : org_html_slides.main.normal_keymap;
  var event_id__4886 = cljs.core.get.call(null, keymap__4885, code__4884);
  if(cljs.core.truth_(event_id__4886)) {
    one.dispatch.fire.call(null, event_id__4886);
    event.preventDefault();
    return event.stopPropagation()
  }else {
    return null
  }
};
org_html_slides.main.install_keyhandler = function install_keyhandler() {
  return goog.events.listen.call(null, new goog.events.KeyHandler(goog.dom.getDocument.call(null)), goog.events.KeyHandler.EventType.KEY, org_html_slides.main.handle_key)
};
org_html_slides.main.presenter_display_html = '\n<html>\n  <head>\n  </head>\n  <body class="presenter-display">\n    <div id="presenter-slide-preview">\n      <div id="presenter-current-slide-container">\n        <h2 class="presenter-label">Current Slide</h2>\n        <div id="presenter-current-slide">\n        </div>\n      </div>\n      <div id="presenter-next-slide-container">\n        <h2 class="presenter-label">Next Slide</h2>\n        <div id="presenter-next-slide">\n        </div>\n      </div>\n     </div>\n     <div id="presenter-times" class="presenter-label">\n       <div id="presenter-elapsed-time"><h2>0:00:00</h2></div>\n       <div id="presenter-clock-time"><h2></h2></div>\n     </div>\n  </body>\n</html>\n';
org_html_slides.main.get_presenter_window = function get_presenter_window() {
  if(cljs.core.truth_(cljs.core.deref.call(null, org_html_slides.main.presenter_window))) {
    if(cljs.core.truth_(cljs.core.deref.call(null, org_html_slides.main.presenter_window).closed)) {
      return cljs.core.reset_BANG_.call(null, org_html_slides.main.presenter_window, null)
    }else {
      return cljs.core.deref.call(null, org_html_slides.main.presenter_window)
    }
  }else {
    return null
  }
};
org_html_slides.main.update_presenter_clock_time = function update_presenter_clock_time(win) {
  var elem__4887 = win.document.getElementById("presenter-clock-time");
  var now__4888 = new Date;
  return elem__4887.innerHTML = goog.string.format.call(null, "<h2>%d:%02d:%02d %s</h2>", cljs.core.rem.call(null, now__4888.getHours(), 12), now__4888.getMinutes(), now__4888.getSeconds(), cljs.core.truth_(12 < now__4888.getHours()) ? "PM" : "AM")
};
org_html_slides.main.update_presenter_elapsed_time = function update_presenter_elapsed_time(win) {
  if(cljs.core.truth_(cljs.core.deref.call(null, org_html_slides.main.presenter_start_time))) {
    var elem__4889 = win.document.getElementById("presenter-elapsed-time");
    var elapsed__4890 = (new Date).getTime() - cljs.core.deref.call(null, org_html_slides.main.presenter_start_time);
    var secs__4891 = elapsed__4890 / 1E3 % 60;
    var mins__4892 = elapsed__4890 / (60 * 1E3) % 60;
    var hours__4893 = elapsed__4890 / (60 * 60 * 1E3);
    return elem__4889.innerHTML = goog.string.format.call(null, "<h2>%d:%02d:%02d</h2>", hours__4893, mins__4892, secs__4891)
  }else {
    return null
  }
};
org_html_slides.main.update_presenter_clock = function update_presenter_clock() {
  var temp__3843__auto____4894 = org_html_slides.main.get_presenter_window.call(null);
  if(cljs.core.truth_(temp__3843__auto____4894)) {
    var win__4895 = temp__3843__auto____4894;
    org_html_slides.main.update_presenter_clock_time.call(null, win__4895);
    org_html_slides.main.update_presenter_elapsed_time.call(null, win__4895);
    return window.setTimeout(update_presenter_clock, 1E3)
  }else {
    return null
  }
};
org_html_slides.main.show_presenter_slides = function show_presenter_slides() {
  var temp__3843__auto____4896 = org_html_slides.main.get_presenter_window.call(null);
  if(cljs.core.truth_(temp__3843__auto____4896)) {
    var win__4897 = temp__3843__auto____4896;
    var div__4898 = win__4897.document.getElementById("presenter-current-slide");
    div__4898.innerHTML = "\ufdd0'html".call(null, org_html_slides.main.current_slide.call(null));
    var div__4899 = win__4897.document.getElementById("presenter-next-slide");
    return div__4899.innerHTML = "\ufdd0'html".call(null, org_html_slides.main.next_slide.call(null))
  }else {
    return null
  }
};
org_html_slides.main.show_presenter_window = function show_presenter_window() {
  var temp__3840__auto____4900 = org_html_slides.main.get_presenter_window.call(null);
  if(cljs.core.truth_(temp__3840__auto____4900)) {
    var win__4901 = temp__3840__auto____4900;
    return win__4901.focus()
  }else {
    cljs.core.reset_BANG_.call(null, org_html_slides.main.presenter_window, goog.window.open.call(null, "", cljs.core.ObjMap.fromObject(["\ufdd0'target", "\ufdd0'toolbar", "\ufdd0'location", "\ufdd0'statusbar", "\ufdd0'menubar"], {"\ufdd0'target":"PRESENTERDISPLAY", "\ufdd0'toolbar":false, "\ufdd0'location":false, "\ufdd0'statusbar":false, "\ufdd0'menubar":false}).strobj));
    var doc__4902 = cljs.core.deref.call(null, org_html_slides.main.presenter_window).document;
    doc__4902.write(org_html_slides.main.presenter_display_html);
    org_html_slides.main.add_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "common"), doc__4902);
    org_html_slides.main.add_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "projection"), doc__4902);
    org_html_slides.main.add_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "presenter"), doc__4902);
    org_html_slides.main.show_presenter_slides.call(null);
    return org_html_slides.main.update_presenter_clock.call(null)
  }
};
org_html_slides.main.install_event_handlers = function install_event_handlers() {
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'show-next-slide"]), function(id, _) {
    return org_html_slides.main.show_next_slide.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'show-prev-slide"]), function(id, _) {
    return org_html_slides.main.show_prev_slide.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'show-first-slide"]), function(id, _) {
    return org_html_slides.main.show_first_slide.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'show-last-slide"]), function(id, _) {
    return org_html_slides.main.show_last_slide.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'toggle-mode"]), function(id, _) {
    return org_html_slides.main.toggle_mode.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'go-to-top"]), function(id, _) {
    return org_html_slides.main.go_to_top.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'show-control-panel"]), function(id, _) {
    return org_html_slides.main.show_control_panel.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'hide-control-panel"]), function(id, _) {
    return org_html_slides.main.hide_control_panel.call(null)
  });
  one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'change-mode"]), function(id, _) {
    return org_html_slides.main.change_mode.call(null)
  });
  return one.dispatch.react_to.call(null, cljs.core.set(["\ufdd0'show-presenter-window"]), function(id, _) {
    return org_html_slides.main.show_presenter_window.call(null)
  })
};
org_html_slides.main.init_stylesheets = function init_stylesheets() {
  return cljs.core.swap_BANG_.call(null, org_html_slides.main.stylesheet_urls, cljs.core.assoc, "projection", org_html_slides.main.stylesheets.call(null, "projection"), "screen", org_html_slides.main.stylesheets.call(null, "screen"), "common", org_html_slides.main.stylesheets.call(null, null), "presenter", org_html_slides.main.stylesheets.call(null, "presenter"))
};
org_html_slides.main.add_image_classes = function add_image_classes() {
  var G__4903__4904 = cljs.core.seq.call(null, org_html_slides.main.dom_tags.call(null, "img"));
  if(cljs.core.truth_(G__4903__4904)) {
    var img__4905 = cljs.core.first.call(null, G__4903__4904);
    var G__4903__4906 = G__4903__4904;
    while(true) {
      var p__4907 = img__4905.parentNode;
      if(cljs.core.truth_(cljs.core._EQ_.call(null, "P", p__4907.nodeName))) {
        goog.dom.classes.add.call(null, p__4907, "image")
      }else {
      }
      var temp__3843__auto____4908 = cljs.core.next.call(null, G__4903__4906);
      if(cljs.core.truth_(temp__3843__auto____4908)) {
        var G__4903__4909 = temp__3843__auto____4908;
        var G__4910 = cljs.core.first.call(null, G__4903__4909);
        var G__4911 = G__4903__4909;
        img__4905 = G__4910;
        G__4903__4906 = G__4911;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
org_html_slides.main.add_outline_text_class = function add_outline_text_class() {
  var G__4912__4913 = cljs.core.seq.call(null, cljs.core.range.call(null, 1, 9));
  if(cljs.core.truth_(G__4912__4913)) {
    var i__4914 = cljs.core.first.call(null, G__4912__4913);
    var G__4912__4915 = G__4912__4913;
    while(true) {
      var G__4916__4917 = cljs.core.seq.call(null, org_html_slides.main.dom_tags.call(null, "div", cljs.core.str.call(null, "outline-text-", i__4914)));
      if(cljs.core.truth_(G__4916__4917)) {
        var elem__4918 = cljs.core.first.call(null, G__4916__4917);
        var G__4916__4919 = G__4916__4917;
        while(true) {
          goog.dom.classes.add.call(null, elem__4918, "outline-text");
          var temp__3843__auto____4920 = cljs.core.next.call(null, G__4916__4919);
          if(cljs.core.truth_(temp__3843__auto____4920)) {
            var G__4916__4921 = temp__3843__auto____4920;
            var G__4924 = cljs.core.first.call(null, G__4916__4921);
            var G__4925 = G__4916__4921;
            elem__4918 = G__4924;
            G__4916__4919 = G__4925;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3843__auto____4922 = cljs.core.next.call(null, G__4912__4915);
      if(cljs.core.truth_(temp__3843__auto____4922)) {
        var G__4912__4923 = temp__3843__auto____4922;
        var G__4926 = cljs.core.first.call(null, G__4912__4923);
        var G__4927 = G__4912__4923;
        i__4914 = G__4926;
        G__4912__4915 = G__4927;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
org_html_slides.main.main = function main() {
  (new goog.debug.Console).setCapturing(true);
  org_html_slides.main.info.call(null, "Application started");
  org_html_slides.main.info.call(null, "Preparing document");
  org_html_slides.main.init_stylesheets.call(null);
  org_html_slides.main.remove_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "projection"));
  org_html_slides.main.remove_stylesheets.call(null, cljs.core.get.call(null, cljs.core.deref.call(null, org_html_slides.main.stylesheet_urls), "presenter"));
  org_html_slides.main.add_image_classes.call(null);
  org_html_slides.main.copy_heading_tags_to_div_classes.call(null);
  org_html_slides.main.add_outline_text_class.call(null);
  org_html_slides.main.install_folds.call(null);
  org_html_slides.main.body_elem.call(null).appendChild(goog.dom.htmlToDocumentFragment.call(null, org_html_slides.main.current_slide_div_html));
  org_html_slides.main.hide_BANG_.call(null, domina.by_id.call(null, "current-slide"));
  cljs.core.reset_BANG_.call(null, org_html_slides.main.slides, org_html_slides.main.get_slides.call(null));
  org_html_slides.main.info.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'count", "\ufdd1'slides"), cljs.core.hash_map("\ufdd0'line", 525)), cljs.core.count.call(null, cljs.core.deref.call(null, org_html_slides.main.slides)));
  org_html_slides.main.info.call(null, "Installing key handler");
  org_html_slides.main.install_event_handlers.call(null);
  org_html_slides.main.install_control_panel.call(null);
  return org_html_slides.main.install_keyhandler.call(null)
};
org_html_slides.main.main.call(null);
