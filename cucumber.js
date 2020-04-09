const common = [
  "test/**/*.feature",
  "--require-module ts-node/register",
  "--require test/*.ts",
].join(" ");

module.exports = {
  default: common,
};
