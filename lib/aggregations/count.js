
module.exports = {
  columns: function() {
    return ['id'];
  },

  aggregate: function(records) {
    return {
      count: records.length
    };
  }
};
