import * as vscode from 'vscode';
import { workspace } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    //console.log('Congratulations, your extension "vscode-file-peek" is now active!');

    let config = vscode.workspace.getConfiguration('module_peek');
    let active_languages = (config.get('activeLanguages') as Array < string > );
    let search_file_extensions = (config.get('searchFileExtensions') as Array < string > );
    let mappings = (config.get('mappings') as Array < string > );
   
    Object.keys(mappings).forEach(function(key,index){
        mappings[key] = mappings[key].replace('${workspaceRoot}', workspace.rootPath)
    })
    /*
    vscode.languages.getLanguages().then((languages: string[]) => {
       console.log("Known languages: " + languages);
    });
    */

    const peek_filter: vscode.DocumentFilter[] = active_languages.map((language) => {
        return {
            language: language,
            scheme: 'file'
        };
    });

    // console.log('-----------start-----------' + new Date());

    // Register the definition provider
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(peek_filter,
            new PeekFileDefinitionProvider(search_file_extensions, mappings))
    );

}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * Provide the lookup so we can peek into the files.
 */
class PeekFileDefinitionProvider implements vscode.DefinitionProvider {
    protected fileSearchExtensions: string[] = [];
    protected mappings: Object = {};


    constructor(fileSearchExtensions: string[] = [], mappings: Object = {}) {
        this.fileSearchExtensions = fileSearchExtensions;
        this.mappings = mappings;
    }

    /**
     * Return list of potential paths to check
     * based upon file search extensions for a potential lookup.
     */
    getPotentialPaths(lookupPath: string): string[] {
        let potential_paths: string[] = [lookupPath];

        // Add on list where we just add the file extension directly
        this.fileSearchExtensions.forEach((extStr) => {
            potential_paths.push(lookupPath + extStr);
        });

        // if we have an extension, then try replacing it.
        let parsed_path = path.parse(lookupPath);
        if (parsed_path.ext !== "") {
            this.fileSearchExtensions.forEach((extStr) => {
                const new_path = path.format({
                    base: parsed_path.name + extStr,
                    dir: parsed_path.dir,
                    ext: extStr,
                    name: parsed_path.name,
                    root: parsed_path.root
                });
                potential_paths.push(new_path);
            });
        }

        return potential_paths;
    }

    /**
     * 注意: 暂时不考虑text!pool/modal/b.info.html这种情况
     * @param mappings 
     * @param potential_fname 
     * @param working_dir 
     */
    getFullPath(potential_fname: string, working_dir: string) {
        let full_path;
        let mapKeys = Object.keys(this.mappings);
        for (var i = 0; i < mapKeys.length; i++) {
            if (potential_fname.startsWith(mapKeys[i])) {
                if (this.mappings[mapKeys[i]] === '') {
                    full_path = path.resolve(working_dir, potential_fname.replace(mapKeys[i], ''));
                } else {
                    full_path = path.resolve(this.mappings[mapKeys[i]], potential_fname.replace(mapKeys[i] + '/', ''));
                }
                break;
            }
        }
        if(!!full_path){
            return full_path;
        }else{
            return path.resolve(working_dir, potential_fname);
        }
    }

    provideDefinition(document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken): vscode.Definition {
        
        // console.log('-----------provideDefinition-----------' + new Date());

        // todo: make this method operate async
        let working_dir = path.dirname(document.fileName);
        let word = document.getText(document.getWordRangeAtPosition(position));
        let line = document.lineAt(position);

        //console.log('====== peek-file definition lookup ===========');
        // console.log('fileName: ' + document.fileName); // 命令调用所在的文件名称,包含路径
        // console.log('working_dir: ' + working_dir); // 命令调用文件所在的目录
        // console.log(position); // 命令被调用的位置。
        // console.log('word: ' + word); // 命令触发的字符串
        // console.log('line: ' + line.text); // 命令触发的完整字符串

        //   fileName: /Users/TechBirds/Documents/netease/xxx.js
        //   working_dir: /Users/TechBirds/Documents/netease
        //   word: ui
        //   line: 'pool/ui'

        // We are looking for strings with filenames
        // - simple hack for now we look for the string with our current word in it on our line
        //   and where our cursor position is inside the string
        let re_str = `\"(.*?${word}.*?)\"|\'(.*?${word}.*?)\'`;
        let match = line.text.match(re_str);

        if (null !== match) {
            let potential_fname = match[1] || match[2];
            let match_start = match.index;
            let match_end = match.index + potential_fname.length;

            // Verify the match string is at same location as cursor
            if ((position.character >= match_start) &&
                (position.character <= match_end)) {

                // console.log('getFullPath start' + new Date());
                let full_path = this.getFullPath(potential_fname,working_dir);
                // console.log('getFullPath end' + new Date());
                
                // console.log('getPotentialPaths start' + new Date());
                // Find all potential paths to check and return the first one found
                let potential_fnames = this.getPotentialPaths(full_path);
                // console.log('getPotentialPaths end' + new Date());

                let found_fname = potential_fnames.find((fname_full) => {
                    return fs.existsSync(fname_full);
                });
                if (found_fname != null) {
                    // console.log('found: ' + found_fname);
                    return new vscode.Location(vscode.Uri.file(found_fname), new vscode.Position(0, 1));
                }
            }
        }

        return null;
    }
}