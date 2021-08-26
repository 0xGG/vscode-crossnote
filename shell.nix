let
  inherit (import ./default.nix) pkgs easy-purescript-nix;
  inherit (easy-purescript-nix) purs-0_13_8 spago pscid;
  inherit (pkgs) nodejs-14_x haskell;
  backendPackages = if builtins.getEnv ("FRONTEND_ONLY") == "true" then
    [ ]
  else
    with pkgs; [
      dbmate
      gmp
      haskell.packages.ghc884.cabal-install
      haskell.packages.ghc884.hlint
      haskell.packages.ghc884.stack
      haskell.packages.ghc884.stylish-haskell
      sqlite
      yq
      zlib
    ];
  frontendPackages = [ purs-0_13_8 spago pscid nodejs-14_x ];
in pkgs.mkShell rec {
  buildInputs = backendPackages ++ frontendPackages;
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath buildInputs;
  LANG = "C.UTF-8";
}