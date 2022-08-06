// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const { getHighlightedText } = require('./utils.js')
const { infer } = require('./infer.js')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const pythonStart = `
# docstring
"""`
const javascriptStart = `
// docstring
/**`

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('config:', vscode.workspace.getConfiguration('cowriter'))
	console.log('Congratulations, your extension "cowriter" is now active!');

	let docgen = vscode.commands.registerCommand('cowriter.docGen', async () => {
		const editor = vscode.window.activeTextEditor
		if (!editor) {
			return
		}

		const { languageId, getText, fileName } = editor.document
		// console.log(languageId, getText, fileName)
		// return

		let { selection, highlighted } = getHighlightedText(editor)

		if (!highlighted) {
			return
		}

		if (languageId === 'python' && highlighted.match(/def[^:]+:/)) {
			const server = vscode.workspace.getConfiguration('cowriter').get('pythonApi')
			if (!server || !server.match(/http:\/\//)) {
				vscode.window.showInformationMessage(`Invalid python docgen server address, please set it in settings > user > extentions > cowriter.`)
				return
			}
			let content = highlighted
			console.log('start python infer', highlighted + pythonStart)
			const text = await infer(server, highlighted + pythonStart)
			const docstring = '\n    """' + text
			const startInd = content.indexOf(':') + 1
			content = content.substring(0, startInd) + docstring + content.substring(startInd)
			console.log('end python infer', content)
			editor.edit(builder => {
				builder.replace(selection, content);
			})
		} else if ((languageId === 'javascript' || languageId === 'typescript') && highlighted.match(/(function|=>)[^\{]+\{/)) {
			const server = vscode.workspace.getConfiguration('cowriter').get('javascriptApi')
			if (!server || !server.match(/http:\/\//)) {
				vscode.window.showInformationMessage(`Invalid javascript docgen server address, please set it in settings > user > extentions > cowriter.`)
				return
			}
			let content = highlighted
			console.log('start javascript infer', content + javascriptStart)
			const text = await infer(server, content + javascriptStart)
			const docstring = '/**' + text
			content = docstring + '\n' + content
			console.log('end javascript infer', content)
			editor.edit(builder => {
				builder.replace(selection, content);
			})
		} else {
			if (!languageId.match(/python|javascript|typescript/)) {
				vscode.window.showInformationMessage(`Your language ${languageId} is not supported.`)
			} else {
				vscode.window.showInformationMessage(`Only support function block.`)
			}
		}

	})

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cowriter.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from cowriter plugin!');
	})

	context.subscriptions.push(docgen, disposable)
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
