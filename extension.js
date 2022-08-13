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
	console.log('Congratulations, your extension "cowriter" is now active!')

	vscode.commands.executeCommand('setContext', 'hasDocGenerating', true)

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
			vscode.window.showInformationMessage(`Invalid selection area`)
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
			let text = null

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'Doc Generating'
			}, async (progress) => {
				
				progress.report({  increment: 0, message: '0s' })

				vscode.commands.executeCommand('setContext', 'cowriter.hasDocGenerating', true)
				let secs = 0
				let inter = setInterval(() => {
					secs++
					progress.report({ increment: 1, message: `${secs}s` })
				}, 1000)
			
				text = await infer(server, highlighted + pythonStart)
				const docstring = '\n    """' + text
				const startInd = content.indexOf(':') + 1
				content = content.substring(0, startInd) + docstring + content.substring(startInd)
				console.log('end python infer', content)
				editor.edit(builder => {
					builder.replace(selection, content);
				})
			
				progress.report({ increment: 100 })
				clearInterval(inter)
				vscode.commands.executeCommand('setContext', 'cowriter.hasDocGenerating', false)
			})

		} else if ((languageId === 'javascript' || languageId === 'typescript') && highlighted.match(/(function|=>)[^\{]+\{/)) {
			const server = vscode.workspace.getConfiguration('cowriter').get('javascriptApi')
			if (!server || !server.match(/http:\/\//)) {
				vscode.window.showInformationMessage(`Invalid javascript docgen server address, please set it in settings > user > extentions > cowriter.`)
				return
			}
			let content = highlighted
			console.log('start javascript infer', content + javascriptStart)
			let text = null

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'Doc Generating'
			}, async (progress) => {
				
				progress.report({  increment: 0, message: '0s' })
				vscode.commands.executeCommand('setContext', 'cowriter.hasDocGenerating', true)
				let secs = 0
				let inter = setInterval(() => {
					secs++
					progress.report({ increment: 1, message: `${secs}s` })
				}, 1000)
			
				text = await infer(server, content + javascriptStart)
				const docstring = '/**' + text
				content = docstring + '\n' + content
				console.log('end javascript infer', content)
				editor.edit(builder => {
					builder.replace(selection, content);
				})
			
				progress.report({ increment: 100 })
				clearInterval(inter)
				vscode.commands.executeCommand('setContext', 'cowriter.hasDocGenerating', false)
			})

		} else {
			if (!languageId.match(/python|javascript|typescript/)) {
				vscode.window.showInformationMessage(`Your language ${languageId} is not supported.`)
			} else {
				vscode.window.showInformationMessage(`Only support function block.`)
			}
		}

	})

	context.subscriptions.push(docgen)
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
