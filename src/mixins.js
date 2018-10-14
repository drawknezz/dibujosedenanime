import _ from 'lodash';

_.mixin({
    /**
     * Llama a la funcion fnName usando el contexto ctx. Si fnName no es una función, o si ctx es falsy, retorna null.
     * Si llama a la funcion, le pasa los argumentos desde el tercero en adelante, en el mismo orden
     * @param {Object} ctx
     * @param {String} fnName
     * @param {...*}
     * @return {*}
     */
    attemptBound: function(ctx, fnName) {
        return !!ctx && _.isFunction(_.get(ctx, fnName)) ? _.get(ctx, fnName).apply(ctx, _.slice(arguments, 2)) : null;
    },
    /**
     * Llama a la funcion fnName usando el contexto ctx. Si fnName no es una función, o si ctx es falsy, retorna null.
     * Si llama a la funcion, le pasa el los elementos del Array args como argumentos
     * Si args no es un Array, le pasa un Array vacío
     * @param {Object} ctx
     * @param {String} fnName
     * @param {Array} args
     * @return {*}
     */
    applyBound: function(ctx, fnName, args) {
        return !!ctx && _.isFunction(_.get(ctx, fnName)) ? _.get(ctx, fnName).apply(ctx, _.isArray(args) ? args : []) : null;
    },

    /**
     * Devuelve descripcion de evaluacion para ruleMatch
     * @param ev
     * @param desc
     * @returns {{_ev: *, _desc: *}}
     */
    rd: function (ev, desc) {
        return {_ev: ev, _desc: desc};
    },

    /**
     * Verifica una serie de reglas contra el objeto (obj).
     *
     * Las reglas deben ser especificadas en el Array ruleSet. Cada elemento de este Array se considera una regla.
     *
     * Cada regla debe especificar una propiedad "returns", que será evaluada y retornada en el caso de que
     * todas las validaciones de la regla devuelvan un valor truthy
     *
     * Para especificar una evaluación dentro de una regla, se debe especificar qué propiedad del Objeto (obj) se quiere evaluar, y
     * como una key en el objeto de la regla, y como valor para esta key, la funcion o el valor que deberia tener para ser
     * considerada un match.
     *
     * Los valores válidos para las keys de evaluación son:
     *
     *  * {Function}:   Al evaluar esta propiedad, se llama a esta función pasándole el valor de la key con el mismo nombre
     *      que este valor, en el Objeto (obj), y se evalúa si esta devuelve un valor truthy.
     *
     *  * {Array}:      Si el valor es un Array, se evalua si la propiedad con el nombre de la key de esta evaluación en el
     *      Objeto (obj) existe dentro del Array, evaluando como match cuando exista.
     *
     *  * {RegExp}:     Para valores RegExp, se considera un match si al hacer RegExp.test(val), esto devuelve true, val siendo el
     *      valor de la key correspondiente a esta evaluación en el Objeto (obj)
     *
     *  * {*}:          Si el valor no es una Función, Array o RegExp, se evalúa si este es estrictamente equivalente al valor
     *      de la key correspondiente a esta evaluación en el Objeto (obj)
     *
     * Ademas de los valores de evaluación detallados arriba, se pueden especificar 3 valores especiales, todos con
     * funcionamiento similar. Estos son $and, $or y $not. Cada uno recibe ya sea un objeto único, especificando una regla,
     * o una lista de reglas, de la misma forma en que se especifica ruleSet.
     *
     *  * $and:     Evaluará todas las reglas espeficicadas, y devolverá un match solo si todas la reglas devuelven truthy.
     *
     *  * $or:      Evaluará todas las reglas hasta encontrar una que devuelva truthy, y al encontrarla devolverá un match.
     *              Si no se encuentra ninguna regla que devuelva truthy, $or es considerado false.
     *
     *  * $not:     Evaluará que todas las reglas especificadas devuelvan un valor falsy, devolviendo true en este caso.
     *              En caso de encontrar una regla que devuelva true, $not será considerado false.
     *
     *  * $inner:   Si las demás propiedades coinciden, considera esta regla como la correcta, utiliza este nuevo
     *              set de reglas para buscar una mejor coincidencia. En caso de encontrar una mejor coincidencia,
     *              retorna el valor "returns" de esta, sino retorna el del padre. Si no encuentra coincidencia
     *              o el padre no tiene propiedad "returns", retorna undefined.
     *
     * Estos tres valores especiales no definen un sub contexto al ser evaluados. Todas las reglas, sin importar cuan
     * profundas en la lista de reglas estén, son evaluadas contra el Objeto (obj).
     *
     * Si se desea especificar un valor return por defecto, para un caso en que no haya ninguna regla que coincida,
     * se debe pasar como tercer argumento al llamar a la función
     *
     * Si se desea especificar un valor return por defecto, para un caso en que una regla no tenga un valor "returns",
     * se debe pasar como cuarto argumento al llamar a la función
     *
     * @param {Object} obj
     * @param {Array} rulesSet
     * @param {*} defResult
     * @param {*} defReturns
     * @return {*}
     */
    ruleMatch: function(obj, rulesSet, defResult, defReturns, ops) {
        rulesSet = _.assert(rulesSet, _.isArray, rulesSet, [rulesSet]);
        var shouldLog = _.get(_.conf(), "debug") || _.get(ops, "log");
        var lvl = _.get(ops, "lvl", 0);
        var logIndentation = _.repeat("\u00b7   ", +lvl);

        var getSubcallOps = function(subDesc, extraOps) {
            return _.extend({}, ops, {
                lvl: lvl + 1,
                logDesc: _.get(ops, "logDesc", "") + (subDesc ? "." + subDesc : "")
            }, extraOps);
        };

        var mapInners = function(rule, ruleIndex, rules, innerOps) {
            return [
                _.chain(rule).get("$inner").ensureArray().compact().map(function(innerRule, innerIndex) {
                    if (_.has(innerRule, "$inner")) {
                        return mapInners(_.extend({}, _.omit(rule, "$inner"), innerRule), innerIndex, rule, {prevDesc: ruleIndex + ".inner"});
                    } else {
                        return _.extend({}, _.omit(rule, "$inner"), innerRule, {_ruleDesc_: _.get(innerOps, "prevDesc") ? _.get(innerOps, "prevDesc") + "." + ruleIndex + ".inner." + innerIndex : ruleIndex + ".inner." + innerIndex});
                    }
                }).value(),
                _.extend({}, _.omit(rule, "$inner"), {
                    _ruleDesc_: _.get(rule, "_ruleDesc_") || String(_.get(innerOps, "prevDesc") ? _.get(innerOps, "prevDesc") + "." + ruleIndex : ruleIndex)
                })
            ];
        };

        var match = _.chain(rulesSet)
            .map(mapInners)
            .flattenDeep()
            .find(function(rule, ruleIdx) {
                var keys = _.chain(rule).keys().reject(_.partial(_.eq, "returns", _)).reject(_.partial(_.eq, "_ruleDesc_", _)).value();

                var evaluateKey = function (o, ev) {
                    if (_.hasAll(ev, "_ev", "_desc")) {
                        return _.assert(o, _.get(ev, "_ev"), true, false);
                    } else {
                        return _.assert(o, ev, true, false);
                    }
                };

                if (shouldLog) {
                    _.attemptBound(console, "log", logIndentation + "_rule_" + _.get(ops, "logDesc", "") + "." + _.get(rule, "_ruleDesc_", ""));
                }

                var keyRetVal = _.every(keys, function(key) {
                    var rulePropValue = _.get(rule, key);
                    var objPropValue = _.get(obj, key);
                    return _.chain({
                            $or: _.partial(_.some, _.ensureArray(rulePropValue), function(subRule, subIndex) {
                                return _.ruleMatch(obj, _.extend({}, subRule, {_ruleDesc_: _.get(rule, "_ruleDesc_") + ".$or." + subIndex}), null, true, getSubcallOps("", {overrideRIndex: subIndex}));
                            }),
                            $and: _.partial(_.every, _.ensureArray(rulePropValue), function(subRule, subIndex) {
                                return _.ruleMatch(obj, subRule, null, true, getSubcallOps((ruleIdx + 1) + ".$and", {overrideRIndex: subIndex}));
                            }),
                            $not: _.partial(_.every,
                                _.ensureArray(rulePropValue),
                                _.negate(function(subRule, subIndex) {
                                    return _.ruleMatch(obj, subRule, null, true, getSubcallOps((ruleIdx + 1) + ".$not", {overrideRIndex: subIndex}));
                                })
                            )
                        })
                        .get(key)
                        .assert(_.isFunction, function(fn) {
                            return fn();
                        }, function() {
                            return evaluateKey(objPropValue, rulePropValue, key);
                        }).tap(function(val) {
                            if (shouldLog) {
                                if (_.has(obj, key)) {
                                    _.attemptBound(console, "log", logIndentation + "\u00b7   key", key, "(", objPropValue, ") evals \"", _.get(rulePropValue, "_desc", rulePropValue), "\" --> ", val);
                                } else {
                                    _.attemptBound(console, "log", logIndentation + "\u00b7   ", "_rule_" + _.getD(ops, "logDesc", ".0") + "." + key + " evals --> ", val);
                                }
                            }
                        })
                        .value();
                });

                return keyRetVal;
            }).value();

        if (_.isUndefined(match) && defResult) {
            return defResult;
        }

        var returnVal = _.has(match, "returns") ? match.returns : (match && defReturns);

        if (shouldLog && _.eq(lvl, 0) && _.isDefined(match)) {
            console.log(logIndentation + " %cReturning ---> ", "color: yellow", returnVal);
        }

        return returnVal;
    },
    /**
     * comprueba si obj es un array, y si no es, lo inserta en uno
     * @param obj
     * @returns {Array}
     */
    ensureArray: function(obj) {
        return _.assert(obj, _.isArray, obj, [obj]);
    },
    /**
     * Evalua el primer argumento contra el resto, si se especifican y son funciones, y devuelve true si todos devuelven true
     * @param {*} e
     */
    matchSelf: function(e) {
        return _.chain(arguments).toArray().result("slice", 1).filter(_.isFunction).map(function(f) {return f(e);}).all().value();
    },
    /**
     * Extrae de la lista de objetos (a) las propiedades especificadas. (Aplica "pick" en cada uno y devuelve una nueva lista con los resultados)
     * extract([{a:1, b:2, c:3}, {a:4, b:1, c:6}], "a", "b") ---> [{a:1, b:2}, {a:4, b:1}];
     * @param {Array} a
     * @param {...String}
     * @returns {Array}
     */
    extract: function(a) {
        var props = _.chain(arguments).toArray().result("slice", 1).flatten().value();
        return _.map(a, function(o) {
            return _.pick(o, props);
        });
    },
    /**
     * Extrae las props especificadas de cada objeto en la lista (a), y los reduce a la suma cada una
     * sumProps([{a:1, b:2, c:3}, {a:4, b:1, c:6}], "a", "b") ---> {a:5, b:3};
     * @param {Array} arr
     * @params {...String}
     * @returns {Object}
     */
    sumProps: function(arr) {
        var props = _.chain(arguments).toArray().result("slice", 1).flatten().value();
        return _.chain(arr).extract(props).reduce(function(c, n) {
            return _.merge(c, n, function(a, b) {
                return a + b;
            }, {});
        }).value();
    },
    /**
     * Evalua el resultado de la Función ev, pasándole como parámetro (o), y si esta devuelve un valor
     * truthy, y (t) es una función, la llama pasándole (o) como parámetro. En caso contrario  y si (f) es una
     * función, la llama pasandole (o) también. Si (t) o (f) no son funciones, se devuelve el valor que tengan asignado.
     *
     * @param {*} o
     * @param {Function} ev
     * @param {*} t
     * @param {*} f
     * @return {*}
     */
    assert: function(o, ev, t, f) {
        var evaluateKey = function (evProp, ruleValue) {
            var evs = [
                {ev: _.isFunction, r: ruleValue},
                {ev: _.isArray, r: _.curry(_.includes, 2)(ruleValue)},
                {ev: _.isRegExp, r: RegExp.prototype.test.bind(ruleValue)},
                {ev: _.isBoolean, r: _.flow(Boolean, _.partial(_.eq, ev, _))},
                {r: _.curry(_.isEqual, 2)(ruleValue)}
            ];

            return _.chain(evs).find(function (e) {
                return _.get(e, "ev") ? e.ev(ruleValue) : true;
            }).thru(function (rl) {
                return rl.r(evProp);
            }).value();
        };

        var r = evaluateKey(o, ev);
        return r ? (_.isFunction(t) ? t(o) : t) : (_.isFunction(f) ? f(o) : f);
    },
    /**
     * LLama a assert, pero omite la evaluación, porque le manda _.identity
     * @param {*} o
     * @param {*} t
     * @param {*} f
     * @return {*}
     */
    assertSelf: function(o, t, f) {
        return _.assert(o, _.identity, t, f);
    },
    /**
     * Realiza la funcionalidad del get pero retorna valor default cuando la propiedad es encontrada pero el valor es null/undefined.
     * @param o
     * @param p
     * @param def
     * @returns {*}
     */
    getD: function(o, p, def) {
        var g = _.get(o, p);
        return _.ruleMatch({
            get: g
        }, [
            {
                get: [null, undefined],
                returns: def
            },
            {
                returns: g
            }
        ]);
    },
    /**
     * Devuelve el primer argumento que evalue como truthy, es un shorthand para
     * cadenas de evaluaciones de este estilo: val1 ||& val2 || valn. Donde se espera que el primero
     * truthy sea el que se asigne a la expresión.
     */
    dflt: function() {
        var args = _.toArray(arguments);
        return _.find(args, Boolean) || _.last(args);
    },
    /**
     * Evalúa si el Objeto (o) tiene todas las propiedades especificadas desde el segundo en adelante.
     * @param {Object} o
     * @return {boolean}
     */
    hasAll: function(o) {
        var keys = _.chain(arguments).toArray().tail().flatten().value();
        var r = _.every(keys, function(k) { return _.has(o, k); });
        return r;
    },

    /**
     * Evalúa si el Objeto (o) tiene todas las propiedades especificadas desde el segundo en adelante y que el valor
     * de dichas propiedades esté definido (no sea null ni undefined)
     * @param {Object} o
     * @return {boolean}
     */
    hasAllDefined: function (o) {
        var keys = _.chain(arguments).toArray().tail().flatten().value();
        return _.every(keys, function (k) {
            return _.has(o, k) && _.isDefined(_.get(o, k));
        });
    },

    /**
     * Retorna true si obj no es undefined o null
     * @param obj
     * @return {boolean}
     */
    isDefined: function(obj) {
        return !_.isUndefined(obj) && !_.isNull(obj);
    },

    /**
     * Retorna el valor booleano negado del objeto pasado por parametro.
     * @param obj
     * @returns {boolean}
     */
    neg: function(obj) {
        return !Boolean(obj);
    },

    /**
     * Retorna los groups generados evaluando obj contra el RegExp especificado.
     * Si se especifica 3 argumentos, el 2do se entiende como un path para obtener la
     * propiedad en obj, y el 3ro como el RegExp
     * @param {Object} obj
     * @return {Array}
     */
    rxGroups: function(obj) {
        var args = _.chain(arguments).toArray().flatten().value();

        return _.ruleMatch(args, [
            {
                $or: [
                    { $and: [
                        {length: 2},
                        {$or: [
                            { 0: _.negate(_.isDefined) },
                            { 1: _.negate(_.isDefined) }
                        ]}
                    ] },
                    { $and: [
                        {length: 3},
                        { 0: _.negate(_.isDefined) },
                        { 1: _.negate(_.isDefined) },
                        { 2: _.negate(_.isDefined) }
                    ] }
                ],
                returns: function() {
                    return null;
                }
            },
            {
                length: 2,
                returns: function() {
                    return _.toArray(String.prototype.match.call(obj, args[1]));
                }
            },
            {
                length: 3,
                returns: function() {
                    var val = _.get(obj, args[1]);
                    return val ? _.toArray(String.prototype.match.call(val, args[2])) : null;
                }
            },
            {
                returns: function() {
                    throw new Error("incorrect number of arguments.");
                }
            }
        ])();
    },

    resolve: function(data) {

        var getSet = function(obj, prop) {
            var value = _.get(obj, prop);
            var deps = _.get(value, "deps");

            if (_.has(value, "val")) {
                return _.extend({}, value, {val: _.get(value, "val")});
            } else {
                return _.extend({}, value, {
                    val: _.applyBound(value, "setter", _.chain(deps).map(function(dep) {
                        var res = {};
                        _.set(res, dep, getSet(obj, dep));
                        return res;
                    }).reduce(function(a,b) {
                        return _.extend({}, a, b);
                    }, {}).map("val").value())
                });
            }
        };

        return _.chain(data).transform(function(res, val, key, obj) {
            _.set(res, key, getSet(_.extend({}, obj, res), key));
        }).mapValues("val").value();
    },

    between: function (val, lowerBound, upperBound, includesLower, includesUpper) {
        var lowerEval = includesLower ? _.gte : _.gt;
        var upperEval = includesUpper ? _.lte : _.lt;

        return lowerEval(val, lowerBound) && upperEval(val, upperBound);
    },

    fillPlaceholders: function (string, _placeholders, options) {
        if (!string) {
            return "";
        }

        var delimiters = _.chain(options).get("delimiters").assert(_.isArray, _.identity, null).value() || ["<<", ">>"];

        delimiters = _.map(delimiters, function (del) {
            return del.replace(/([*$?|\[\]}])/ig, "\\$1");
        });

        var placeholders = _.extend({self: _placeholders}, _placeholders);

        var res = string;
        _(placeholders).keys().each(function (key) {
            res = res.replace(new RegExp(delimiters[0] + "\s*" + key + "\s*" + delimiters[1], "ig"), placeholders[key]);
        }).value();
        return res.replace(new RegExp(delimiters[0] + "[^" + delimiters.join("") + "]*" + delimiters[1], "ig"), "");
    },

    /**
     * Setea una especie de configuración interna, que se puede usar en cualquier lugar llamando a
     * _.conf(). tiene 3 funciones, "_default": setea el objeto por defecto, "default": setea la configuración
     * como el default, y "clear", elimina todas las propiedades del objeto de configuración.
     *
     * ejemplo de llamadas:
     *
     * _.conf({prop1: true}); --> setea prop1 como true
     * _.conf.clear()({prop1: true}); --> borra todas las configuraciones, y setea prop1 como true
     * _.conf._default({a: 2}).default --> setea el default como {a: 2}, y reemplaza lo que haya con este default
     * _.conf.clear()({a: 2}) --> reemplaza lo que haya con {a: 2}
     *
     */
    conf: (function() {
        var dflt = { debug: false };
        var config = _.extend({}, dflt);

        var set = function(confs) {
            _.assertSelf(confs, _.curry(_.extend, 2)(config));
            return config;
        };

        _.set(set, "_default", function(df) {
            dflt = _.extend({}, df);
            return set;
        });
        _.set(set, "default", function() {
            config = _.extend({}, dflt);
            return set;
        });
        _.set(set, "clear", function() {
            config = {};
            return set;
        });

        return set;
    })(),

    ng: function() {
        return _.negate.apply(this, _.chain(arguments).toArray().flatten().value());
    },
  
    repReg: (str, reg, rep) => reg.test(str) ? _.repReg(_.replace(str, reg, rep), reg, rep) : str,
  
    regFromStr: (reg, flags) => new RegExp(_.repReg(reg, /\(\?<[^>]+>([^)]+)\)/, "($1)"), flags),
  
    regGroups: (str, reg, flags) => {
      let names = _.map(reg.match(/<([^>]+)>/g), a => a.replace(/(<|>)/g, ""))
      let groups = _.tail(str.match(_.regFromStr(reg, flags)));
      return _.zipObject(names, groups);
    },
  
    regexRules: (str, rules, def) => {
      return _.ruleMatch(
        {str: str}, 
        _.concat(
          _.map(rules, r => ({
            str: _.regFromStr(_.get(r, "reg")), 
            returns: _.flow(
              _.partial(_.regGroups, _, _.get(r, "reg")), 
              _.get(r, "ev")
            )
          })),
          [{returns: a => def || ""}]
        )
      )(str)
    },
    
    ngram: (num, word) => {
      return _.chain(word).toLower().map((l, i) => {
        return _.chain(word).drop(i).slice(0, num).attemptBound("join", "").value();
      }).filter({length: num}).value();
    },
  
    compareStrings: function(str1, str2) {
      var left = _.ngram(2, str1);
      var right = _.ngram(2, str2);
      var rightLength = right.length;
      var length = left.length;
      var index = -1;
      var intersections = 0;
      var rightPair, leftPair, offset;
      
      while (++index < length) {
        leftPair = left[index];
        offset = -1;
        
        while (++offset < rightLength) {
          rightPair = right[offset];
          
          if (_.eq(leftPair, rightPair)) {
            intersections++;
            right[offset] = '';
            break;
          }
        }
      }
      
      return 2 * intersections / (left.length + rightLength)
    },

    concatAll: function () {
        var args = _.chain(arguments).toArray().flatten().value();

        return [].concat(args);
    },

    rejectAll: function (arr) {
        var args = _.chain(arguments).toArray().tail().value();

        return _.reject(arr, function (val) {
            return _.includes(args, val);
        });
    }
});

export default _;