require 'rubygems'
require 'plist'

pub_file_dir = '/Users/youhei/dev/www/autopagerize.net/public/files'

def update_versions
  info = Plist::parse_xml('src.safariextension/Info.plist')
  v = info['CFBundleShortVersionString']
  bv = info['CFBundleVersion']
  up = Plist::parse_xml('update.plist.org')
  up['Extension Updates'][0]['CFBundleShortVersionString'] = v
  up['Extension Updates'][0]['CFBundleVersion'] = bv
  up.save_plist 'update.plist'
  v
end

def sy cmd
  puts cmd
  system cmd
end

task :default do
end

desc 'update'
task :update do
  v = update_versions
  sy 'chmod 644 src.safariextz'
  sy 'xattr -d com.apple.quarantine src.safariextz'
  sy "cp src.safariextz packages/autopagerize_for_safari-#{v}.safariextz"
  sy "cp src.safariextz #{pub_file_dir}/autopagerize_for_safari.safariextz"
  sy "cp packages/autopagerize_for_safari-#{v}.safariextz #{pub_file_dir}/"
  sy "cp update.plist #{pub_file_dir}/"
end

desc 'deploy'
task :deploy do
  sy 'sh /Users/youhei/dev/www/autopagerize.net/dep.sh'
end

