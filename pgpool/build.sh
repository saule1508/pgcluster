VER=`cat ../version.txt`
docker build -t pgpool:$VER .
