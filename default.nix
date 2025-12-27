{
  rev      ? "e97b3e4186bcadf0ef1b6be22b8558eab1cdeb5d",
  sha256   ? "114ggf0xbwq16djg4qql3jljknk9xr8h7dw18ccalwqg9k1cgv0g",
  nixpkgs  ? builtins.fetchTarball {
    name   = "nixpkgs-${rev}";
    url    = "https://github.com/nixos/nixpkgs/archive/${rev}.tar.gz";
    sha256 = sha256;
  },
  system   ? builtins.currentSystem,
  ...
}:

with import nixpkgs {
  inherit system;
};

let
  gitignoreSource = (import (pkgs.fetchFromGitHub {
    owner = "hercules-ci";
    repo = "gitignore.nix";
    rev = "cb5e3fdca1de58ccbc3ef53de65bd372b48f567c";
    sha256 = "sha256-XmjITeZNMTQXGhhww6ed/Wacy2KzD6svioyCX7pkUu4=";
  }) { inherit lib; }).gitignoreSource;


  src = gitignoreSource ./.;

  # npmlock2nix = pkgs.callPackage (builtins.fetchGit {
  #   rev = "9197bbf397d76059a76310523d45df10d2e4ca81";
  #   url = "https://github.com/nix-community/npmlock2nix.git";
  # }) {};
  # tools  = npmlock2nix.v2.build {nodejs=pkgs.nodejs_21;src="${src}/tools"; installPhase="";};
  # client = npmlock2nix.v2.build {nodejs=pkgs.nodejs_21;src="${src}/client"; installPhase="";};
  # server = npmlock2nix.v2.build {nodejs=pkgs.nodejs_21;src="${src}/server"; installPhase="";};
  # tools-modules =  npmlock2nix.v2.node_modules {nodejs=pkgs.nodejs_21;src="${src}/tools";};
  # client-modules = npmlock2nix.v2.node_modules {nodejs=pkgs.nodejs_21;src="${src}/client";};
  # server-modules = npmlock2nix.v2.node_modules {nodejs=pkgs.nodejs_21;src="${src}/server";};

  napalm = pkgs.callPackage (builtins.fetchGit {
    rev = "a8215ccf1c80070f51a92771f3bc637dd9b9f7ee";
    url = "https://github.com/nix-community/napalm.git";
  }) {};

  tools = napalm.buildPackage "${src}/tools" {};
  client = napalm.buildPackage "${src}/client" {};
  server = napalm.buildPackage "${src}/server" {};

  tools-modules = "${tools}/_napalm-install/node_modules";
  client-modules = "${client}/_napalm-install/node_modules";
  server-modules = "${server}/_napalm-install/node_modules";

  client-static = napalm.buildPackage "${src}/client" {
    installPhase = ''
      npm run build
      cp -r ./build $out
    '';
  };

  #npm = pkgs.callPackage (builtins.fetchGit {
  #  rev = "991a792bccd611842f6bc1aa99fe80380ad68d44";
  #  url = "https://github.com/serokell/nix-npm-buildpackage.git";
  #}) {};
  #tools = npm.buildNpmPackage  {src="${src}/tools";};
  #client = npm.buildNpmPackage {src="${src}/client";};
  #server = npm.buildNpmPackage {src="${src}/server";};
  #tools-modules = "${tools}/node_modules";
  #client-modules = "${client}/node_modules";
  #server-modules = "${server}/node_modules";

in
{
  inherit pkgs
    tools tools-modules
    client client-modules client-static
    server server-modules
  ;
}
