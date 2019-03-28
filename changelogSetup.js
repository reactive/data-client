module.exports = function(Handlebars) {
  Handlebars.registerHelper('includeMerges', function(options) {
    if (!options) return;
    if (!this.merges || !this.commits) return options.fn(this);
    this.commits = this.commits.concat(
      this.merges.map(merge => ({
        ...merge,
        subject: merge.message,
        shorthash: `#${merge.id}`,
      }))
    );
    return options.fn(this);
  });
};
