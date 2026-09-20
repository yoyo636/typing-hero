#!/usr/bin/env bash
# 把 dazi 命令安装到 PATH（仅当前用户，不修改系统目录）
set -u

SRC="${BASH_SOURCE[0]:-$0}"
DIR="$(cd -P "$(dirname "$SRC")" && pwd)"
BIN="$HOME/.local/bin"

mkdir -p "$BIN"
chmod +x "$DIR/dazi"

# 优先尝试 /usr/local/bin（无需密码时）
if [ -w /usr/local/bin ]; then
  ln -sf "$DIR/dazi" /usr/local/bin/dazi
  echo "✓ 已安装到 /usr/local/bin/dazi"
else
  ln -sf "$DIR/dazi" "$BIN/dazi"
  echo "✓ 已安装到 $BIN/dazi"
  for rc in "$HOME/.zshrc" "$HOME/.bash_profile" "$HOME/.bashrc"; do
    [ -f "$rc" ] || continue
    if ! grep -q '\.local/bin' "$rc" 2>/dev/null; then
      printf '\n# 打字小英雄 dazi 命令\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$rc"
      echo "✓ 已把 ~/.local/bin 加入 PATH ($rc)"
    fi
  done
fi

echo
echo "安装完成！新开一个终端窗口后即可使用："
echo "  dazi          启动并打开打字小英雄"
echo "  dazi stop     停止服务"
echo "  dazi status   查看状态"
echo
echo "当前终端可先执行： export PATH=\"$HOME/.local/bin:\$PATH\""
