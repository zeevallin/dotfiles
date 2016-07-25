#!/bin/sh
#
# Executes commands at the start of an interactive session.
#
# Authors:
#   Sorin Ionescu <sorin.ionescu@gmail.com>
#   Philip Vieira <zee@vall.in>
#

# prezto
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# projects
export PROJECTS_PATH=$HOME/Projects

# go
if [ $(which go) ] && [ -x $(which go) ]; then
  export GOPATH=$HOME/.go
  export GOBIN=$GOPATH/bin
  export PATH=$GOBIN:/usr/local/opt/go/bin:$PATH
  if ! [ -d $GOPATH ]; then mkdir -p $GOPATH ;fi
else
  echo "[x] go-lang not installed"
fi

# docker
if [ -x "$(which boot2docker)" ]; then
  type boot2docker >/dev/null 2>&1 && $(boot2docker shellinit 2>/dev/null)
else
  echo "[x] boot2docker is not installed"
fi

# vault
export VAULT_ADDR=https://vault.chatspry.com/
export VAULT_SKIP_VERIFY=true

# markdown
md () { pandoc -s -f markdown -t man $1 | groff -T utf8 -man | less }
alias markdown=md

# useful tools
killport () { lsof -i :$1 | sed 1d | awk '{print $2}' | xargs kill -9 }

# tabtab source for realms package
# uninstall by removing these lines or running `tabtab uninstall realms`
[[ -f $PROJECTS_PATH/Mojang/RealmsCLI/node_modules/tabtab/.completions/realms.zsh ]] && . $PROJECTS_PATH/Mojang/RealmsCLI/node_modules/tabtab/.completions/realms.zsh
# begin sift completion
. <(sift --completion)
# end sift completion
