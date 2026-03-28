import * as vscode from 'vscode';
import { connectCommand } from './auth';
import { WorkspaceManager } from './workspace';

export function activate(context: vscode.ExtensionContext) {
    console.log('VeriFetch is now active!');

    let connectDisposable = vscode.commands.registerCommand('verifetch.connect', () => {
        connectCommand(context);
    });

    let openWorkspaceDisposable = vscode.commands.registerCommand('verifetch.openWorkspace', () => {
        WorkspaceManager.openWebviewOnly(context, `<fetch top="50">\n  <entity name="account">\n    <attribute name="name" />\n    <attribute name="telephone1" />\n  </entity>\n</fetch>`);
    });

    let executeDisposable = vscode.commands.registerCommand('verifetch.execute', () => {
        WorkspaceManager.handleEditorCommand(context);
    });

    context.subscriptions.push(connectDisposable, openWorkspaceDisposable, executeDisposable);
}

export function deactivate() {}
