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

# go
if [ $(which go) ] && [ -x $(which go) ]; then
  export GOPATH=$HOME/.go
  export GOBIN=$GOPATH/bin
  export PATH=$PATH:/usr/local/opt/go/bin:$GOBIN
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
