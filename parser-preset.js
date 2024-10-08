module.exports = {
  parserOpts: {
    headerPattern: /^(\[[a-zA-Z][a-zA-Z0-9]+-?[0-9]*\])\s(build|ci|chore|docs|feat|fix|pref|refactor|revert|style|test)(\([a-z]+[a-z-]*[a-z]+\))?: (.*)$/,
    headerCorrespondence: ['issue', 'type', 'scope', 'subject'],
  },
};
