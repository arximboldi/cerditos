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

    function add-modules-link() {
      nix_path=$1
      local_path=$REPO_ROOT/$2/node_modules

      # if we already made a link, remove it to redo it
      if test -L "$local_path"; then
        \rm -rf "$local_path"
      fi
      if test -d "$local_path"; then
        echo "warning: $2 is manually populated, won't use Nix generated one"
      else
        ln -sf "$nix_path" "$local_path"
      fi

      # expose the binaries in those node_modules
      addToSearchPath PATH "$local_path/.bin"
    }

    add-modules-link ${tools-modules} tools
    add-modules-link ${client-modules} client
    add-modules-link ${server-modules} server

    # this is for the backend later...
    export HTTPS=true
    export STATE_DIR="$REPO_ROOT/state"
    test -d "$STATE_DIR" || mkdir -p "$STATE_DIR"
  '';
}
