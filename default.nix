{
  rev      ? "e2b34f0f11ed8ad83d9ec9c14260192c3bcccb0d",
  sha256   ? "1n9lhqprqnsiv4nw59mh5ab7hchx7lhvq43kkv64473jwz1xv7ki",
  nixpkgs  ? builtins.fetchTarball {
    name   = "nixpkgs-${rev}";
    url    = "https://github.com/nixos/nixpkgs/archive/${rev}.tar.gz";
    sha256 = sha256;
  },
  ...
}:

with import nixpkgs {};

let
  gitignoreSource = (import (pkgs.fetchFromGitHub {
    owner = "hercules-ci";
    repo = "gitignore.nix";
    rev = "80463148cd97eebacf80ba68cf0043598f0d7438";
    sha256 = "1l34rmh4lf4w8a1r8vsvkmg32l1chl0p593fl12r28xx83vn150v";
  }) { inherit lib; }).gitignoreSource;

  npm = pkgs.callPackage (builtins.fetchGit {
    rev = "991a792bccd611842f6bc1aa99fe80380ad68d44";
    url = "https://github.com/serokell/nix-npm-buildpackage.git";
  }) {};

  napalm = pkgs.callPackage (builtins.fetchGit {
    rev = "a8215ccf1c80070f51a92771f3bc637dd9b9f7ee";
    url = "https://github.com/nix-community/napalm.git";
  }) {};

  src = gitignoreSource ./.;

  tools = napalm.buildPackage "${src}/tools" {};
  tools-modules = "${tools}/_napalm-install/node_modules";

  client = napalm.buildPackage "${src}/client" {};
  client-modules = "${client}/_napalm-install/node_modules";

  server = napalm.buildPackage "${src}/server" {};
  server-modules = "${server}/_napalm-install/node_modules";

in
{
  inherit pkgs
    tools tools-modules
    client client-modules
    server server-modules
  ;
}
