{
  function flatten(array) {
    var index = - 1,
        length = array.length,
        result = [];

    while (++index < length) {
      var value = array[index];

      if (Array.isArray(value)) {
        // recursively flatten arrays (susceptible to call stack limits)
        value = flatten(value);

        var valIndex = -1,
            valLength = value.length,
            resIndex = result.length;

        result.length += valLength;
        while (++valIndex < valLength) {
          result[resIndex++] = value[valIndex];
        }
      } else {
        result.push(value);
      }
    }
    return result;
  }

  function getParams(params) {
    if (Array.isArray(params)) {
      return flatten(params);
    } else {
      return [params];
    }
  }
}

start
  = hydration

hydration
  = "[" entry:hydration_entry "]" { return flatten([entry]) }

hydration_entry
  = first:literal "," second:hydration_entry { return [first, second] }
  / first:relation "," second:hydration_entry { return [first, second] }
  / first:aggregation "," second:hydration_entry { return [first, second] }
  / relation
  / aggregation
  / column:literal { return column }

relation
  = name:literal "=" hydration:hydration { return { relation: name, hydration: hydration } }

aggregation
  = name:literal "=" aggregation:aggregation_expression { return { relation: name, aggregation: aggregation }}

aggregation_expression
  = "custom." agg:literal "(" params:hydration_entry ")" { return { custom: true, method: agg, params: getParams(params) }}
  / "custom." agg:literal { return { custom: true, method: agg } }
  / agg:literal "(" params:hydration_entry ")" { return { method: agg, params: getParams(params) }}
  / agg:literal  { return { method: agg }}

literal
  = chars:[0-9a-zA-Z_\*]+ { return chars.join(""); }
