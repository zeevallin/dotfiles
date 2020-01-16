# !/bin/sh
# Executes commands at login pre-zshrc.

# limits
if [[ "$OSTYPE" == darwin* ]]; then
  ulimit -n 65536 >/dev/null 2>&1
  ulimit -u 2048 >/dev/null 2>&1
fi

# browser
if [[ "$OSTYPE" == darwin* ]]; then
  export BROWSER='open'
fi

# editors
export EDITOR='vim'
export VISUAL='vim'
export PAGER='less'
export DEVELOP='code'

# language
if [[ -z "$LANG" ]]; then
  export LANG='en_US.UTF-8'
fi

# paths

# Set the the list of directories that cd searches
cdpath=(
  $cdpath
)

# Set the list of directories that Zsh searches for programs
path=(
  ./bin
  $HOME/.bin
  /usr/local/bin
  /usr/bin
  /bin
  /usr/local/sbin
  /usr/sbin
  /sbin
)

# Set fpath for functions
fpath=(
  $HOME/.zshfuncs
  $fpath
)

# ensure path arrays do not contain duplicates
typeset -gU cdpath fpath mailpath path

# projects
export PROJECTS_PATH=$HOME/Projects

# code
export CODE_PATH=$HOME/Code

# less
export LESS='-F -g -i -M -R -S -w -X -z-4'
if (( $#commands[(i)lesspipe(|.sh)] )); then
  export LESSOPEN="| /usr/bin/env $commands[(i)lesspipe(|.sh)] %s 2>&-"
fi

# temporary files
if [[ ! -d "$TMPDIR" ]]; then
  export TMPDIR="/tmp/$LOGNAME"
  mkdir -p -m 700 "$TMPDIR"
fi
TMPPREFIX="${TMPDIR%/}/zsh"

# k8s
export KUBECONFIG=$HOME/.kube/config.yaml

# gpg
export GPG_TTY=`tty`

# lush
export LUSH_ROOT="$HOME/go/src/gitlab.com/LUSHDigital/soa"
export LUSH_SERVICE_IMAGE="eu.gcr.io/utilities-prod-europe-west2/soa/dev-ops/microservice-bootstrap:latest"
