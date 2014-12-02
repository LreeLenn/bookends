
module.exports = {
  columns: function(spec) {
    return ['id'];
  },

  aggregate: function(records) {
    return {
      count: records.length
    };
  }
};
