const vscode = require('vscode')


const getHighlightedText = (editor) => {
  const { selection } = editor
  const highlightRange = new vscode.Range(editor.selection.start, editor.selection.end)
  const highlighted = editor.document.getText(highlightRange)
  return { selection, highlighted }
}

module.exports = {
    getHighlightedText
}
