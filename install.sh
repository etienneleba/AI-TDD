#!/usr/bin/env bash
set -euo pipefail

# Reset
Color_Off=''

# Regular Colors
Red=''
Green=''
Dim='' # White

# Bold
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
    # Reset
    Color_Off='\033[0m' # Text Reset

    # Regular Colors
    Red='\033[0;31m'   # Red
    Green='\033[0;32m' # Green
    Dim='\033[0;2m'    # White

    # Bold
    Bold_Green='\033[1;32m' # Bold Green
    Bold_White='\033[1m'    # Bold White
fi

error() {
    echo -e "${Red}error${Color_Off}:" "$@" >&2
    exit 1
}

info() {
    echo -e "${Dim}$@ ${Color_Off}"
}

info_bold() {
    echo -e "${Bold_White}$@ ${Color_Off}"
}

success() {
    echo -e "${Green}$@ ${Color_Off}"
}

# [Initialize color codes and helper functions as in bun.sh]

# Check for bun
command -v bun >/dev/null ||
    error 'bun is required to run aitdd. Please install bun first.'

# Define the GitHub repository URL
github_repo="https://github.com/di-sukharev/AI-TDD"

# Construct the download URL for your CLI
# Modify this URL to point to the specific release or directory containing cli.ts
aitdd_uri="$github_repo/releases/latest/download/out.zip"

# Define the installation directory
install_dir=${HOME}/.aitdd
bin_dir=$install_dir/bin
exe=$bin_dir/aitdd

# Create the installation directory if it doesn't exist
mkdir -p "$bin_dir" ||
    error "Failed to create install directory \"$bin_dir\""

# Download and extract your CLI files
curl --fail --location --output "$exe.zip" "$aitdd_uri" ||
    error "Failed to download aitdd from \"$aitdd_uri\""

unzip -oqd "$install_dir" "$exe.zip" ||
    error 'Failed to extract aitdd'

# Create the aitdd wrapper command
cat <<EOF >"$exe"
#!/usr/bin/env bash
set -euo pipefail
bun $install_dir/cli.js "\$@"
EOF

# Make the wrapper executable
chmod +x "$exe" ||
    error 'Failed to set permissions on aitdd executable'

# New section: Update shell configuration to include aitdd in PATH
install_env=AiTDD_INSTALL
bin_env=\$$install_env/bin

tilde_bin_dir=$(tildify "$bin_dir")
quoted_install_dir=\"${install_dir//\"/\\\"}\"

case $(basename "$SHELL") in
fish)
    fish_config=$HOME/.config/fish/config.fish
    if [[ -w $fish_config ]]; then
        echo -e '\n# AiTDD\nset --export $install_env $quoted_install_dir\nset --export PATH $bin_env \$PATH' >> "$fish_config"
        echo "Added \"$tilde_bin_dir\" to \$PATH in fish config"
    else
        echo "Manually add the following lines to your fish config ($fish_config):"
        echo "  set --export $install_env $quoted_install_dir"
        echo "  set --export PATH $bin_env \$PATH"
    fi
    ;;
zsh)
    zsh_config=$HOME/.zshrc
    if [[ -w $zsh_config ]]; then
        echo -e '\n# AiTDD\nexport $install_env=$quoted_install_dir\nexport PATH=\"$bin_env:\$PATH\"' >> "$zsh_config"
        echo "Added \"$tilde_bin_dir\" to \$PATH in zsh config"
    else
        echo "Manually add the following lines to your zsh config ($zsh_config):"
        echo "  export $install_env=$quoted_install_dir"
        echo "  export PATH=\"$bin_env:\$PATH\""
    fi
    ;;
bash)
    bash_config=$HOME/.bashrc
    if [[ -w $bash_config ]]; then
        echo -e '\n# AiTDD\nexport $install_env=$quoted_install_dir\nexport PATH=$bin_env:\$PATH' >> "$bash_config"
        echo "Added \"$tilde_bin_dir\" to \$PATH in bash config"
    else
        echo "Manually add the following lines to your bash config ($bash_config):"
        echo "  export $install_env=$quoted_install_dir"
        echo "  export PATH=$bin_env:\$PATH"
    fi
    ;;
*)
    echo "Your shell is not explicitly supported for automatic PATH update. Please add $bin_dir to your PATH manually."
    ;;
esac

# Success message
success "aitdd was installed successfully. Please restart your terminal or source your shell config for the changes to take effect."
