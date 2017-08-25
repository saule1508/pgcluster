VER=`cat version.txt`
sudo docker build -t pgpool:$VER .
