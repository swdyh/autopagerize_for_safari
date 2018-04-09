#!/bin/sh -x

# 手順
# 1. Safariでビルドするとsrc.safariextzができる
# 2. ファイルを配布するにはs3にファイルをアップロードする
# 3. それからギャラリーのsubmissionをする https://developer.apple.com//safari/extensions/submission/
#     - icon_256.png,screencapture.pngを使う
#
# s3へのアップはenvchainのセットアップが必要
# このバケット用のポリシー arn:aws:iam::862835154395:policy/s3_autopagerize_net
# このポリシーがつけられてるユーザ arn:aws:iam::862835154395:user/s3_autopagerize_manager
# ↑のユーザのキーをenvchainへいれる。リージョンは、AWS_DEFAULT_REGION=ap-northeast-1
#
# ファイルだけつくる
# ./up.sh
#
# s3へアップロードする
# ./up.sh -p
#

sv=`plutil -convert json src.safariextension/Info.plist -o - | jq -r .CFBundleShortVersionString`
bv=`plutil -convert json src.safariextension/Info.plist -o - | jq -r .CFBundleVersion`
echo "CFBundleShortVersionString:$sv CFBundleVersion:$bv"

plutil -replace 'Extension Updates.CFBundleShortVersionString' -string $sv update.plist -o update.plist
plutil -replace 'Extension Updates.CFBundleVersion' -string $bv update.plist -o update.plist
git diff update.plist

cp src.safariextz autopagerize_for_safari.safariextz
cp src.safariextz autopagerize_for_safari-$sv.safariextz
to="s3://autopagerize.net/files"

if [ "$1" = "-p" ]; then
  echo "upload file"
  # setup
  # envchain --set s3_autopagerize_net AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION
  envchain s3_autopagerize_net aws s3 cp autopagerize_for_safari.safariextz $to
  envchain s3_autopagerize_net aws s3 cp autopagerize_for_safari-$sv.safariextz $to
  envchain s3_autopagerize_net aws s3 cp update.plist $to
fi

if [ "$1" = "-c" ]; then
  echo "clean file"
  rm autopagerize_for_safari*
  rm src.safariextz
fi

