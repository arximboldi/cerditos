{
  ...
}@args :

with import ./default.nix args;
with pkgs;

pkgs.mkShell {
  inputsFrom = [
    client
    server
    tools
  ];
  packages = [
    curl
    nodejs
  ];
  shellHook = ''
    export REPO_ROOT=`dirname ${toString ./shell.nix}`

    function add-safe-symlink() {
      nix_path=$1
      local_path=$REPO_ROOT/$2
      # if we already made a link, remove it to redo it
      if test -L "$local_path"; then
        \rm -rf "$local_path"
      fi
      if test -d "$local_path"; then
        echo "warning: $2 is manually populated, won't use Nix generated one"
      else
        ln -sf "$nix_path" "$local_path"
      fi
    }

    add-safe-symlink "${client-modules}" client/node_modules
    add-safe-symlink "${server-modules}" server/node_modules
    add-safe-symlink "${tools-modules}" tools/node_modules

    addToSearchPath PATH "$REPO_ROOT/client/node_modules/.bin"
    addToSearchPath PATH "$REPO_ROOT/server/node_modules/.bin"
    addToSearchPath PATH "$REPO_ROOT/tools/node_modules/.bin"

    # this is for the backend later...
    export STATE_DIR="$REPO_ROOT/state"
    test -d "$STATE_DIR" || mkdir -p "$STATE_DIR"
  '';
}
