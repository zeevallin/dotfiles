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
    export GOPROXY=https://goproxy.io
    export GOPATH=/usr/local/go:$HOME/go
    export GOBIN=/usr/local/go/bin
    export GOTOOLSBIN=/usr/local/gotools/bin
    export GOMODPATH=/usr/local/go/pkg/mod
    path=(
      $GOBIN
      $GOTOOLSBIN
      $path
    )
  fi
else
  echo "[x] go not installed"
fi

# gctl
if [ $(which gctl) ] && [ -x $(which gctl) ]; then
  gctl gen-zsh-completion > ~/.zshfuncs/_gctl
else
  echo "[x] gctl not installed"
fi

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/.tools/google-cloud-sdk/path.zsh.inc" ]; then . "$HOME/.tools/google-cloud-sdk/path.zsh.inc"; fi

# The next line enables shell command completion for gcloud.
if [ -f "$HOME/.tools/google-cloud-sdk/completion.zsh.inc" ]; then . "$HOME/.tools/google-cloud-sdk/completion.zsh.inc"; fi

# docker
alias dcfg='make build && docker-compose up --build --force-recreate'
alias dcbg='make build && docker-compose up -d --build --force-recreate'
alias dclf='docker-compose logs -f'
alias docker-clean='docker rm -fv $( docker ps -qa)'
alias docker-gc='docker run --rm --userns host -v /var/run/docker.sock:/var/run/docker.sock -v /etc:/etc -e REMOVE_VOLUMES=1 spotify/docker-gc'

# mysql
runmysql () { docker run --rm --name mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -p 33060:33060 -d mysql:latest }
stopmysql () { docker rm -f mysql }
logmysql () { docker logs -f mysql }

# markdown
md () { pandoc -s -f markdown -t man $1 | groff -T utf8 -man | less }
alias markdown=md

# useful tools
killport () { lsof -i :$1 | sed 1d | awk '{print $2}' | xargs kill -9 }

# lush
lush-new-agg () { docker run -v $LUSH_ROOT/aggregators:/service -it $LUSH_SERVICE_IMAGE }
lush-new-service () { docker run -v $LUSH_ROOT/service:/service -it $LUSH_SERVICE_IMAGE }

secret () { $DEVELOP $HOME/.secret }
