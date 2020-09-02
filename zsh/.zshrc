#!/bin/sh
# executes commands at the start of an interactive session

# prezto
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# secret
if [[ -s "${ZDOTDIR:-$HOME}/.secret" ]]; then
  source "${ZDOTDIR:-$HOME}/.secret"
fi

# go
if [ $(which go) ] && [ -x $(which go) ]; then
  if [[ "$OSTYPE" == darwin* ]]; then
    export GOPATH=/usr/local/go:$HOME/go
    export GOBIN=/usr/local/go/bin
    export GOTOOLSBIN=/usr/local/gotools/bin
    path=(
      $GOBIN
      $GOTOOLSBIN
      $path
    )
  fi
else
  echo "[x] go not installed"
fi

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/.tools/google-cloud-sdk/path.zsh.inc" ]; then . "$HOME/.tools/google-cloud-sdk/path.zsh.inc"; fi

# The next line enables shell command completion for gcloud.
if [ -f "$HOME/.tools/google-cloud-sdk/completion.zsh.inc" ]; then . "$HOME/.tools/google-cloud-sdk/completion.zsh.inc"; fi

# docker
alias docker-clean='docker rm -fv $( docker ps -qa)'
alias docker-gc='docker run --rm --userns host -v /var/run/docker.sock:/var/run/docker.sock -v /etc:/etc -e REMOVE_VOLUMES=1 spotify/docker-gc'

# markdown
md () { pandoc -s -f markdown -t man $1 | groff -T utf8 -man | less }
alias markdown=md

# useful tools
killport () { lsof -i :$1 | sed 1d | awk '{print $2}' | xargs kill -9 }

secret () { $DEVELOP $HOME/.secret }
