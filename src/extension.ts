// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sio from 'socket.io-client';

class CogPreviewProvider implements vscode.WebviewViewProvider {

	public _view?: vscode.WebviewView;

	getHtml(head: string, content: string) {
		return `
		<head>
<link href="http://fonts.cdnfonts.com/css/narita-monospace" rel="stylesheet">
<style>@import url('http://fonts.cdnfonts.com/css/narita-monospace');</style>
<style>
body{overflow-y:scroll;font:16px monospace,monospace}pre{margin:0;overflow-x:hidden}.t{text-decoration:none}@media(max-width:999px){body{font-size:1.94vw}}@media(prefers-color-scheme:dark){body{background:#000;color:#fff}a{color:#6CF}#l{color:#F33}#g{filter:invert(1)}}img,#b{max-width:80ch}span{display:inline-block}
</style>
</head>
		<body cz-shortcut-listen="true"><div style="display:table;margin:16px auto" id="a">
<div id="b">
	<h1>${head}</h1>
	<hr>
	${content} 
</div>
</div>
</body>`
	}
	resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		this._view = webviewView;
		webviewView.webview.html = this.getHtml("Cog Preview", "This preview allows you to easily debug and monitor cogs.");
	}

}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Create our socket
	var socket = sio.io('http://127.0.0.1:8080');

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "asgardcogs" is now active!');

	// Ident
	let identifier = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	identifier.text = "Offline";
	identifier.color = "grey";
	identifier.tooltip = "Connection Status To TCore";
	identifier.show();

	// Preview
	let previewCogProvider = new CogPreviewProvider();

	socket.on('connect_failed', err => {
		identifier.text = "Errored";
		identifier.color = "red";
		vscode.window.showInformationMessage('Connection to the TCore failed');
	})

	socket.on('connect_error', err => {
		identifier.text = "Errored";
		identifier.color = "red";
		vscode.window.showInformationMessage(`An error occured while connecting to the TCore: ${err}`);
	})

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('asgardcogs.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from AsgardCogs!');
	});

	let connect = vscode.commands.registerCommand('asgardcogs.connectCore', () => {
		// Create our socket
		socket = sio.io('http://127.0.0.1:8080');
		
		socket.on('connect', function () {
			console.log("Connected");
			identifier.color = "green";
			identifier.show();
			identifier.text = "$(megaphone) Connected";
			socket.emit('connects', { data: 'I\'m connected!' });
		});


		socket.on('system', function (data: any) {
			console.log(data)
			// Deduce type of system message
			if ("cog" in data) {
				// $(gear~spin)
				if (previewCogProvider._view){
					previewCogProvider._view.webview.html =
						previewCogProvider.getHtml(
							`Cog ${data.cog} failed`, 
							`Exception: ${data.e}<br>Traceback:<br>${data.traceback}`
						);
				}
				//vscode.window.showInformationMessage(`\$(gear) Cog ${data.cog} failed.\nException:${data.e}\nTraceback ${data.traceback}`);
			}
		});
	})

	let killconnection = vscode.commands.registerCommand('asgardcogs.killConnection', () => {
		socket.disconnect();
		identifier.text = "Killed";
		identifier.color = "red";
		vscode.window.showInformationMessage('Killed connection to the TCore');
	})



	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('asgardcogs.cogPreview', previewCogProvider)
    );

	context.subscriptions.push(connect);
	context.subscriptions.push(killconnection);
}

// this method is called when your extension is deactivated
export function deactivate() { }

