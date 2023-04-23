#!/bin/bash

dir=$1
cd $dir
rm  -fr _metadata manifest.fingerprint ../src
# sed -i.bak 's/BASIC: [0-9]\+/BASIC: 0/g' enums.js
# sed -i.bak 's/PLUS: [0-9]\+/PLUS: 0/g' enums.js
# sed -i.bak 's/PRO: [0-9]\+/PRO: 0/g' enums.js
# sed -i.bak 's/ELITE: [0-9]\+/ELITE: 0/g' enums.js
# sed -i.bak 's/TITAN: [0-9]\+/TITAN: 0/g' enums.js
sed -i.bak 's/this.#quota = quota;/quota.TotalPrivateLists = 999;quota.MaxPrivateListItems = 9999;quota.MaxLevel = 999999;this.#quota = quota;/g' quota.js
patchResult=$(diff quota.js.bak quota.js |grep -c -e "^<")
rm quota.js.bak
sed -i '/differential_fingerprint/d' manifest.json
cat manifest.json |jq 'del(.key)' > m2.json
mv m2.json manifest.json
sed -i 's/"version":\s\{1,\}"\(.*\)"/"version": "9\1"/' manifest.json
sed -i 's/"update_url":\s\{1,\}"\(.*\)"/"update_url": "https:\/\/raw.githubusercontent.com\/tofuliang\/AIPRM\/master\/update.xml"/' manifest.json
cd ..

ver=$2
sed -i "s/\"\sversion=\"[0-9\.]*\"/\" version=\"99.${ver}\"/" update.xml
mv $dir src
echo $patchResult