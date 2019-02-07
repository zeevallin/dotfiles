#!/bin/sh
#
# Executes commands at the start of an interactive session.
#
# Authors:
#   Sorin Ionescu <sorin.ionescu@gmail.com>
#   Philip Vieira <zee@vall.in>
#

# lush
export LUSH_ROOT="/Users/zeeraw/go/src/gitlab.com/LUSHDigital/soa"
export LUSH_SERVICE_IMAGE="eu.gcr.io/utilities-prod-europe-west2/soa/dev-ops/microservice-bootstrap:latest"
lush-new-agg () { docker run -v $LUSH_ROOT/aggregators:/service -it $LUSH_SERVICE_IMAGE }
lush-new-service () { docker run -v $LUSH_ROOT/service:/service -it $LUSH_SERVICE_IMAGE }

# docker
alias dcfg='make build && docker-compose up --build --force-recreate'
alias dcbg='make build && docker-compose up -d --build --force-recreate'
alias dclf='docker-compose logs -f'
alias docker-clean='docker rm -fv $( docker ps -qa)'
alias docker-gc='docker run --rm --userns host -v /var/run/docker.sock:/var/run/docker.sock -v /etc:/etc -e REMOVE_VOLUMES=1 spotify/docker-gc'

# prezto
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# projects
export PROJECTS_PATH=$HOME/Projects

# go
if [ $(which go) ] && [ -x $(which go) ]; then
  if [[ "$OSTYPE" == darwin* ]]; then
    export GOPATH=/usr/local/go:$HOME/go
    export GOBIN=/usr/local/go/bin
    export GOTOOLSBIN=/usr/local/gotools/bin
    export PATH=$GOBIN:$GOTOOLSBIN:$PATH
  fi
else
  echo "[x] go-lang not installed"
fi

# vault
export VAULT_ADDR=https://vault.chatspry.com/
export VAULT_SKIP_VERIFY=true

# k8s
export KUBECONFIG=$HOME/.kube/fursuit-k8s-kubeconfig.yaml:$HOME/.kube/config

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

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/zeeraw/tools/google-cloud-sdk/path.zsh.inc' ]; then . '/Users/zeeraw/tools/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/zeeraw/tools/google-cloud-sdk/completion.zsh.inc' ]; then . '/Users/zeeraw/tools/google-cloud-sdk/completion.zsh.inc'; fi
