{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default =
          with pkgs;
          mkShell {
            buildInputs = [
              tree-sitter
              tree-sitter-grammars.tree-sitter-javascript
              tree-sitter-grammars.tree-sitter-typescript
              nodejs
              (python311Packages.python.withPackages (p: [ p.rangehttpserver ]))
            ];
            shellHook = '''';
          };
      }
    );
}
