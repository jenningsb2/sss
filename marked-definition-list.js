// Custom definition list extension for marked
const definitionList = {
  name: 'definitionList',
  level: 'block',
  start(src) {
    return src.match(/^[^\n]+\n:/)?.index;
  },
  tokenizer(src) {
    const rule = /^([^\n]+)\n:[ \t]*([^\n]+)(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const tokens = {
        type: 'definitionList',
        raw: match[0],
        term: this.lexer.inlineTokens(match[1].trim(), []),
        definition: this.lexer.inlineTokens(match[2].trim(), [])
      };
      return tokens;
    }
  },
  renderer(token) {
    return `<dl><dt>${this.parser.parseInline(token.term)}</dt><dd>${this.parser.parseInline(token.definition)}</dd></dl>\n`;
  }
};

module.exports = definitionList;
