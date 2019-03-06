#!/bin/sh

# execute code only if STDERR is bound to a TTY.
[[ -o INTERACTIVE && -t 2 ]] && {

# print the message
cat <<-EOF
See You Space Cowboy...
EOF

} >&2
