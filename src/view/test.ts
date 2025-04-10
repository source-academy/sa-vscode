import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function setupTreeView() {
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  console.log("Creating tree view");
  vscode.window.createTreeView("nodeDependencies", {
    treeDataProvider: new NodeDependenciesProvider(
      "/home/heyzec/Documents/NUS/FYP/sa-vscode",
    ),
  });
}

const hardcode = [
  ["Rune Trials", "Apr 01, 2025, 9:00 PM"],
  ["Rune Reading", "Apr 02, 2025, 9:00 PM"],
  ["Beyond the Second Dimension", "Apr 03, 2025, 9:00 PM"],
  ["Curve Introduction", "Apr 04, 2025, 9:00 PM"],
  ["Curve Manipulation", "Apr 05, 2025, 9:00 PM"],
  ["Beyond the First Dimension", "Apr 06, 2025, 9:00 PM"],
  ["Premorseal Communications", "Apr 07, 2025, 9:00 PM"],
  ["POTS and Pans", "Apr 08, 2025, 9:00 PM"],
  ["Musical Diversions", "Apr 09, 2025, 11:00 PM"],
  ["Search and Rescue", "Apr 10, 2025, 11:00 PM"],
  ["Sorting Things Out", "Apr 11, 2025, 11:00 PM"],
  ["Robotic Trials", "Apr 12, 2025, 11:00 PM"],
  ["Moving about on Planet Y", "Apr 13, 2025, 7:00 PM"],
  ["Finding ELDRIC", "Apr 14, 2025, 7:00 PM"],
  ["Know Your Environment", "Apr 15, 2025, 7:00 PM"],
  ["Corrective Sky Surgery", "Apr 16, 2025, 7:00 PM"],
  ["Reuse Your Pairs", "Apr 17, 2025, 7:00 PM"],
  ["Streaming the Anomaly", "Apr 18, 2025, 7:00 PM"],
  ["The Anomaly in Focus", "Apr 19, 2025, 7:00 PM"],
  ["The Essence of the Source", "Apr 20, 2025, 7:00 PM"],
];
export class NodeDependenciesProvider
  implements vscode.TreeDataProvider<Dependency | DependencyFolder>
{
  constructor(private workspaceRoot: string) {}

  // impl
  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  // impl
  getChildren(
    element?: Dependency,
  ): Thenable<(Dependency | DependencyFolder)[]> {
    if (!element) {
      return Promise.resolve([
        new DependencyFolder(
          "Missions",
          "",
          vscode.TreeItemCollapsibleState.Expanded,
        ),
        new DependencyFolder(
          "Quests",
          "",
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
        new DependencyFolder(
          "Path",
          "",
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
      ]);
    }
    return Promise.resolve(
      hardcode.map(
        (entry) =>
          new Dependency(
            entry[0],
            entry[1],
            vscode.TreeItemCollapsibleState.None,
          ),
      ),
    );

    // console.log("Attempt to child")
    // if (!this.workspaceRoot) {
    //   vscode.window.showInformationMessage("No dependency in empty workspace");
    //   return Promise.resolve([]);
    // }

    // if (element) {
    //   return Promise.resolve(
    //     this.getDepsInPackageJson(
    //       path.join(
    //         this.workspaceRoot,
    //         "node_modules",
    //         element.label,
    //         "package.json",
    //       ),
    //     ),
    //   );
    // } else {
    //   const packageJsonPath = path.join(this.workspaceRoot, "package.json");
    //   if (this.pathExists(packageJsonPath)) {
    //     return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
    //   } else {
    //     vscode.window.showInformationMessage("Workspace has no package.json");
    //     return Promise.resolve([]);
    //   }
    // }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const toDep = (moduleName: string, version: string): Dependency => {
        if (
          this.pathExists(
            path.join(this.workspaceRoot, "node_modules", moduleName),
          )
        ) {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.Collapsed,
          );
        } else {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.None,
          );
        }
      };

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map((dep) =>
            toDep(dep, packageJson.dependencies[dep]),
          )
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map((dep) =>
            toDep(dep, packageJson.devDependencies[dep]),
          )
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

class DependencyFolder extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "assets", "icon.png"),
    dark: path.join(__filename, "..", "..", "assets", "icon.png"),
  };
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }
}
