#!/bin/sh
#
# Executes commands at logout.
#
# Authors:
#   Philip Vieira <zee@vall.in>
#

# Execute code only if STDERR is bound to a TTY.
[[ -o INTERACTIVE && -t 2 ]] && {

# Print the message.
cat <<-EOF
See You Space Cowboy...
EOF

} >&2