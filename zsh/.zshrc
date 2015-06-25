#!/bin/sh
#
# Executes commands at the start of an interactive session.
#
# Authors:
#   Sorin Ionescu <sorin.ionescu@gmail.com>
#   Philip Vieira <zee@vall.in>
#

# Source Prezto.
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# docker
if [ -x "$(which boot2docker)" ]; then
  type boot2docker >/dev/null 2>&1 && $(boot2docker shellinit 2>/dev/null)
else
  echo "[x] boot2docker is not installed"
fi
