#!/bin/sh

# execute code that does not affect the current session in the background
{
  # compile the completion dump to increase startup speed
  zcompdump="${ZDOTDIR:-$HOME}/.zcompdump"
  if [[ -s "$zcompdump" && (! -s "${zcompdump}.zwc" || "$zcompdump" -nt "${zcompdump}.zwc") ]]; then
    zcompile "$zcompdump"
  fi
} &!

# execute code only if STDERR is bound to a TTY
[[ -o INTERACTIVE && -t 2 ]] && {

  # print a random, hopefully interesting, adage
  if (( $+commands[fortune] )); then
    fortune -s
    print
  fi

} >&2
