
module.exports = {
  hydration: function() {
    return ['id'];
  },

  aggregate: function(records) {
    return {
      count: records.length
    };
  }
};
